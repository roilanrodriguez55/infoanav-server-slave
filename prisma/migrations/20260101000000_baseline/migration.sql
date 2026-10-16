-- Baseline: esquema inicial limpio (sin RLS, sin roles ni funciones de auth heredadas)

--
-- Name: api; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS api;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS auth;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

--
-- Name: get_dashboard_stats(); Type: FUNCTION; Schema: api; Owner: -
--

CREATE FUNCTION api.get_dashboard_stats() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _id_fuera_servicio uuid[];
  _id_operativa uuid[];
BEGIN
  -- Obtener IDs de estados críticos/fuera de servicio
  SELECT array_agg(id_estado) INTO _id_fuera_servicio 
  FROM api.estados 
  WHERE nombre IN ('Fuera de Servicio', 'Pendiente de Reparación', 'Desactivada');

  -- Obtener IDs de estados operativos
  SELECT array_agg(id_estado) INTO _id_operativa 
  FROM api.estados 
  WHERE nombre IN ('Operativa', 'Activo demo', 'En Pruebas', 'En Instalación');

  RETURN json_build_object(
    'senales_total', (SELECT count(*) FROM api.senales WHERE deleted_at IS NULL),
    'senales_operativas', (SELECT count(*) FROM api.senales WHERE id_estado = ANY(_id_operativa) AND deleted_at IS NULL),
    'fuera_servicio', (SELECT count(*) FROM api.senales WHERE id_estado = ANY(_id_fuera_servicio) AND deleted_at IS NULL),
    'fallas_abiertas', (SELECT count(*) FROM api.fallas WHERE fecha_restablecer IS NULL AND deleted_at IS NULL),
    'mant_proximos', (SELECT count(*) FROM api.mantenimientos WHERE (fecha_inicio > now() AND fecha_inicio < now() + interval '7 days') AND deleted_at IS NULL)
  );
END;
$$;

--
-- Name: get_fault_analytics(integer, integer); Type: FUNCTION; Schema: api; Owner: -
--

CREATE FUNCTION api.get_fault_analytics(p_mes integer DEFAULT NULL::integer, p_anio integer DEFAULT NULL::integer) RETURNS TABLE(semana text, total_fallas bigint, tiempo_medio_resolucion interval)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _target_month int := COALESCE(p_mes, extract(month from now())::int);
  _target_year int := COALESCE(p_anio, extract(year from now())::int);
BEGIN
  -- Si no hay fallas en el mes solicitado, intentamos buscar las más recientes para que el gráfico no salga vacío en desarrollo
  IF NOT EXISTS (SELECT 1 FROM api.fallas WHERE extract(month from fecha_falla) = _target_month AND extract(year from fecha_falla) = _target_year AND deleted_at IS NULL) THEN
    SELECT extract(month from max(fecha_falla))::int, extract(year from max(fecha_falla))::int 
    INTO _target_month, _target_year
    FROM api.fallas WHERE deleted_at IS NULL;
  END IF;

  RETURN QUERY
  SELECT 
    ('Semana ' || extract(week from fecha_falla)::text)::text as semana,
    count(*)::bigint as total_fallas,
    avg(duracion_de_falla)::interval as tiempo_medio_resolucion
  FROM api.fallas
  WHERE extract(month from fecha_falla) = _target_month 
    AND extract(year from fecha_falla) = _target_year
    AND deleted_at IS NULL
  GROUP BY 1
  ORDER BY 1;
END;
$$;

--
-- Name: get_status_by_zone(); Type: FUNCTION; Schema: api; Owner: -
--

CREATE FUNCTION api.get_status_by_zone() RETURNS TABLE(nombre_zona text, conteo_senales bigint, estado_critico bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _id_critico uuid[];
BEGIN
  SELECT array_agg(id_estado) INTO _id_critico 
  FROM api.estados 
  WHERE nombre IN ('Fuera de Servicio', 'Pendiente de Reparación', 'Desactivada');

  RETURN QUERY
  SELECT 
    z.nombre::text,
    count(s.id_senal)::bigint,
    count(s.id_senal) FILTER (WHERE s.id_estado = ANY(_id_critico))::bigint
  FROM api.zonas z
  LEFT JOIN api.senales s ON s.id_zona = z.id_zona AND s.deleted_at IS NULL
  WHERE z.deleted_at IS NULL
  GROUP BY z.id_zona, z.nombre
  ORDER BY z.nombre;
END;
$$;

--
-- Name: caracteristicas; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.caracteristicas (
    id_caracteristica uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: categorias; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.categorias (
    id_categoria uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: colores; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.colores (
    id_color uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: colores_luz; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.colores_luz (
    id_colorluz uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: empresas; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.empresas (
    id_empresa uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: energias; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.energias (
    id_energia uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: equipamientos_senal; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.equipamientos_senal (
    id_equipamiento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_tipo_equipamiento uuid,
    nombre character varying(100),
    cantidad integer,
    num_inventario character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: estaciones; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.estaciones (
    id_estacion uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: estados; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.estados (
    id_estado uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: estados_senal; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.estados_senal (
    id_estado_senal uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: fallas; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.fallas (
    id_falla uuid DEFAULT gen_random_uuid() NOT NULL,
    fecha_falla timestamp without time zone,
    fecha_restablecer timestamp without time zone,
    fecha_pronost_restablecer timestamp without time zone,
    id_tipo_falla uuid,
    causa_de_falla text,
    medidas character varying(100),
    reporto character varying(100),
    rescatada boolean,
    observaciones character varying(100),
    duracion_de_falla interval,
    diferencia_tiempo interval,
    id_origen_falla uuid,
    transmite character varying(100),
    anar character varying(50),
    rg character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text,
    id_senal uuid
);

--
-- Name: formas; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.formas (
    id_forma uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: mantenimientos; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.mantenimientos (
    id_mantenimiento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_tipo_mant uuid,
    ident_mantenimiento character varying(50),
    fecha_inicio timestamp without time zone,
    fecha_finalizacion timestamp without time zone,
    tiempo_empleado interval,
    aseguro character varying(100),
    id_estado_senal uuid,
    trabajo_realizado character varying(100),
    costo_mn numeric(12,2),
    costo_mlc numeric(12,2),
    diesel_lit numeric(10,2),
    gasolina_lit numeric(10,2),
    informa character varying(100),
    transmite character varying(100),
    rg character varying(50),
    orden character varying(50),
    introdujo character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text,
    id_senal uuid
);

--
-- Name: marcas_tope; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.marcas_tope (
    id_marca_tope uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: mares; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.mares (
    id_mar uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: materiales; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.materiales (
    id_material uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: modelos_senal; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.modelos_senal (
    id_modelo uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: origenes_falla; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.origenes_falla (
    id_origen_falla uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: senales; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.senales (
    id_senal uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_lsm character varying(150) NOT NULL,
    id_tipo uuid,
    id_categoria uuid,
    nombre character varying(150) NOT NULL,
    id_modelo uuid,
    id_empresa uuid,
    id_estacion uuid,
    luminica boolean,
    secreta boolean,
    fecha_instalacion timestamp without time zone,
    id_usuario_navegacion uuid,
    monitoreo character varying(100),
    id_zona uuid,
    reflector_radar boolean,
    repeticion boolean,
    id_estado uuid,
    id_material uuid,
    control_distancia boolean,
    id_energia uuid,
    id_marca_tope uuid,
    observaciones character varying(200),
    id_color uuid,
    id_forma uuid,
    altura numeric(8,2),
    elevacion numeric(8,2),
    profundidad numeric(8,2),
    alcancegeografico numeric(8,2),
    latitud double precision,
    longitud double precision,
    id_mar uuid,
    ubicacion character varying(100),
    alcanceluminico numeric(8,2),
    intensidadluminica numeric(10,2),
    id_colorluz uuid,
    id_caracteristica uuid,
    periodo numeric(8,2),
    oscuridad numeric(8,2),
    tiempoluz numeric(8,2),
    potenciabombillo integer,
    voltagebombillo integer,
    consumodestellador numeric(8,2),
    id_equipamiento uuid,
    sistema_fondeo character varying(200),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: tipos_equipamiento; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.tipos_equipamiento (
    id_tipo_equipamiento uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: tipos_falla; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.tipos_falla (
    id_tipo_falla uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: tipos_mantenimiento; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.tipos_mantenimiento (
    id_tipo_mant uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: tipos_senal; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.tipos_senal (
    id_tipo uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: usuarios_navegacion; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.usuarios_navegacion (
    id_usuario_navegacion uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: zonas; Type: TABLE; Schema: api; Owner: -
--

CREATE TABLE api.zonas (
    id_zona uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

--
-- Name: usuarios_sistema; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.usuarios_sistema (
    id_usuario_sist uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario character varying(50) NOT NULL,
    contrasena text NOT NULL,
    cargo_ocupa character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text,
    id_empresa uuid
);

--
-- Name: COLUMN usuarios_sistema.deleted_at; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.usuarios_sistema.deleted_at IS 'Soft-delete timestamp; NULL while the row is active';

--
-- Name: caracteristicas caracteristica_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.caracteristicas
    ADD CONSTRAINT caracteristica_pkey PRIMARY KEY (id_caracteristica);

--
-- Name: categorias categoria_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.categorias
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id_categoria);

--
-- Name: colores_luz color_luz_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.colores_luz
    ADD CONSTRAINT color_luz_pkey PRIMARY KEY (id_colorluz);

--
-- Name: colores color_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.colores
    ADD CONSTRAINT color_pkey PRIMARY KEY (id_color);

--
-- Name: empresas empresa_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.empresas
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (id_empresa);

--
-- Name: energias energia_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.energias
    ADD CONSTRAINT energia_pkey PRIMARY KEY (id_energia);

--
-- Name: equipamientos_senal equipamiento_señal_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.equipamientos_senal
    ADD CONSTRAINT "equipamiento_señal_pkey" PRIMARY KEY (id_equipamiento);

--
-- Name: estaciones estacion_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.estaciones
    ADD CONSTRAINT estacion_pkey PRIMARY KEY (id_estacion);

--
-- Name: estados estado_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.estados
    ADD CONSTRAINT estado_pkey PRIMARY KEY (id_estado);

--
-- Name: estados_senal estado_senal_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.estados_senal
    ADD CONSTRAINT estado_senal_pkey PRIMARY KEY (id_estado_senal);

--
-- Name: fallas fallas_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.fallas
    ADD CONSTRAINT fallas_pkey PRIMARY KEY (id_falla);

--
-- Name: formas forma_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.formas
    ADD CONSTRAINT forma_pkey PRIMARY KEY (id_forma);

--
-- Name: mantenimientos mantenimientos_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.mantenimientos
    ADD CONSTRAINT mantenimientos_pkey PRIMARY KEY (id_mantenimiento);

--
-- Name: mares mar_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.mares
    ADD CONSTRAINT mar_pkey PRIMARY KEY (id_mar);

--
-- Name: marcas_tope marca_tope_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.marcas_tope
    ADD CONSTRAINT marca_tope_pkey PRIMARY KEY (id_marca_tope);

--
-- Name: materiales material_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.materiales
    ADD CONSTRAINT material_pkey PRIMARY KEY (id_material);

--
-- Name: modelos_senal modelo_señal_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.modelos_senal
    ADD CONSTRAINT "modelo_señal_pkey" PRIMARY KEY (id_modelo);

--
-- Name: origenes_falla origen_falla_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.origenes_falla
    ADD CONSTRAINT origen_falla_pkey PRIMARY KEY (id_origen_falla);

--
-- Name: senales señales_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_pkey" PRIMARY KEY (id_senal);

--
-- Name: tipos_equipamiento tipo_equipamiento_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.tipos_equipamiento
    ADD CONSTRAINT tipo_equipamiento_pkey PRIMARY KEY (id_tipo_equipamiento);

--
-- Name: tipos_falla tipo_falla_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.tipos_falla
    ADD CONSTRAINT tipo_falla_pkey PRIMARY KEY (id_tipo_falla);

--
-- Name: tipos_mantenimiento tipo_mantenimiento_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.tipos_mantenimiento
    ADD CONSTRAINT tipo_mantenimiento_pkey PRIMARY KEY (id_tipo_mant);

--
-- Name: tipos_senal tipo_señal_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.tipos_senal
    ADD CONSTRAINT "tipo_señal_pkey" PRIMARY KEY (id_tipo);

--
-- Name: usuarios_navegacion usuario_navegacion_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.usuarios_navegacion
    ADD CONSTRAINT usuario_navegacion_pkey PRIMARY KEY (id_usuario_navegacion);

--
-- Name: zonas zona_pkey; Type: CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.zonas
    ADD CONSTRAINT zona_pkey PRIMARY KEY (id_zona);

--
-- Name: usuarios_sistema usuario_sistema_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.usuarios_sistema
    ADD CONSTRAINT usuario_sistema_pkey PRIMARY KEY (id_usuario_sist);

--
-- Name: usuarios_sistema usuario_sistema_usuario_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.usuarios_sistema
    ADD CONSTRAINT usuario_sistema_usuario_key UNIQUE (usuario);

--
-- Name: idx_fallas_fecha; Type: INDEX; Schema: api; Owner: -
--

CREATE INDEX idx_fallas_fecha ON api.fallas USING btree (fecha_falla);

--
-- Name: idx_mantenimientos_fecha; Type: INDEX; Schema: api; Owner: -
--

CREATE INDEX idx_mantenimientos_fecha ON api.mantenimientos USING btree (fecha_inicio);

--
-- Name: idx_senales_estado; Type: INDEX; Schema: api; Owner: -
--

CREATE INDEX idx_senales_estado ON api.senales USING btree (id_estado) WHERE (deleted_at IS NULL);

--
-- Name: caracteristicas rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.caracteristicas DO INSTEAD  UPDATE api.caracteristicas SET deleted_at = now()
  WHERE (caracteristicas.id_caracteristica = old.id_caracteristica);

--
-- Name: categorias rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.categorias DO INSTEAD  UPDATE api.categorias SET deleted_at = now()
  WHERE (categorias.id_categoria = old.id_categoria);

--
-- Name: colores rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.colores DO INSTEAD  UPDATE api.colores SET deleted_at = now()
  WHERE (colores.id_color = old.id_color);

--
-- Name: colores_luz rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.colores_luz DO INSTEAD  UPDATE api.colores_luz SET deleted_at = now()
  WHERE (colores_luz.id_colorluz = old.id_colorluz);

--
-- Name: empresas rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.empresas DO INSTEAD  UPDATE api.empresas SET deleted_at = now()
  WHERE (empresas.id_empresa = old.id_empresa);

--
-- Name: energias rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.energias DO INSTEAD  UPDATE api.energias SET deleted_at = now()
  WHERE (energias.id_energia = old.id_energia);

--
-- Name: equipamientos_senal rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.equipamientos_senal DO INSTEAD  UPDATE api.equipamientos_senal SET deleted_at = now()
  WHERE (equipamientos_senal.id_equipamiento = old.id_equipamiento);

--
-- Name: estaciones rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.estaciones DO INSTEAD  UPDATE api.estaciones SET deleted_at = now()
  WHERE (estaciones.id_estacion = old.id_estacion);

--
-- Name: estados rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.estados DO INSTEAD  UPDATE api.estados SET deleted_at = now()
  WHERE (estados.id_estado = old.id_estado);

--
-- Name: estados_senal rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.estados_senal DO INSTEAD  UPDATE api.estados_senal SET deleted_at = now()
  WHERE (estados_senal.id_estado_senal = old.id_estado_senal);

--
-- Name: fallas rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.fallas DO INSTEAD  UPDATE api.fallas SET deleted_at = now()
  WHERE (fallas.id_falla = old.id_falla);

--
-- Name: formas rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.formas DO INSTEAD  UPDATE api.formas SET deleted_at = now()
  WHERE (formas.id_forma = old.id_forma);

--
-- Name: mantenimientos rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.mantenimientos DO INSTEAD  UPDATE api.mantenimientos SET deleted_at = now()
  WHERE (mantenimientos.id_mantenimiento = old.id_mantenimiento);

--
-- Name: marcas_tope rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.marcas_tope DO INSTEAD  UPDATE api.marcas_tope SET deleted_at = now()
  WHERE (marcas_tope.id_marca_tope = old.id_marca_tope);

--
-- Name: mares rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.mares DO INSTEAD  UPDATE api.mares SET deleted_at = now()
  WHERE (mares.id_mar = old.id_mar);

--
-- Name: materiales rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.materiales DO INSTEAD  UPDATE api.materiales SET deleted_at = now()
  WHERE (materiales.id_material = old.id_material);

--
-- Name: modelos_senal rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.modelos_senal DO INSTEAD  UPDATE api.modelos_senal SET deleted_at = now()
  WHERE (modelos_senal.id_modelo = old.id_modelo);

--
-- Name: origenes_falla rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.origenes_falla DO INSTEAD  UPDATE api.origenes_falla SET deleted_at = now()
  WHERE (origenes_falla.id_origen_falla = old.id_origen_falla);

--
-- Name: senales rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.senales DO INSTEAD  UPDATE api.senales SET deleted_at = now()
  WHERE (senales.id_senal = old.id_senal);

--
-- Name: tipos_equipamiento rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.tipos_equipamiento DO INSTEAD  UPDATE api.tipos_equipamiento SET deleted_at = now()
  WHERE (tipos_equipamiento.id_tipo_equipamiento = old.id_tipo_equipamiento);

--
-- Name: tipos_falla rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.tipos_falla DO INSTEAD  UPDATE api.tipos_falla SET deleted_at = now()
  WHERE (tipos_falla.id_tipo_falla = old.id_tipo_falla);

--
-- Name: tipos_mantenimiento rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.tipos_mantenimiento DO INSTEAD  UPDATE api.tipos_mantenimiento SET deleted_at = now()
  WHERE (tipos_mantenimiento.id_tipo_mant = old.id_tipo_mant);

--
-- Name: tipos_senal rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.tipos_senal DO INSTEAD  UPDATE api.tipos_senal SET deleted_at = now()
  WHERE (tipos_senal.id_tipo = old.id_tipo);

--
-- Name: usuarios_navegacion rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.usuarios_navegacion DO INSTEAD  UPDATE api.usuarios_navegacion SET deleted_at = now()
  WHERE (usuarios_navegacion.id_usuario_navegacion = old.id_usuario_navegacion);

--
-- Name: zonas rl_soft_delete; Type: RULE; Schema: api; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO api.zonas DO INSTEAD  UPDATE api.zonas SET deleted_at = now()
  WHERE (zonas.id_zona = old.id_zona);

--
-- Name: usuarios_sistema rl_soft_delete; Type: RULE; Schema: auth; Owner: -
--

CREATE RULE rl_soft_delete AS
    ON DELETE TO auth.usuarios_sistema DO INSTEAD  UPDATE auth.usuarios_sistema SET deleted_at = now()
  WHERE (usuarios_sistema.id_usuario_sist = old.id_usuario_sist);

--
-- Name: equipamientos_senal equipamiento_señal_id_tipo_equipamiento_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.equipamientos_senal
    ADD CONSTRAINT "equipamiento_señal_id_tipo_equipamiento_fkey" FOREIGN KEY (id_tipo_equipamiento) REFERENCES api.tipos_equipamiento(id_tipo_equipamiento);

--
-- Name: fallas fallas_id_origen_falla_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.fallas
    ADD CONSTRAINT fallas_id_origen_falla_fkey FOREIGN KEY (id_origen_falla) REFERENCES api.origenes_falla(id_origen_falla);

--
-- Name: fallas fallas_id_senal_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.fallas
    ADD CONSTRAINT fallas_id_senal_fkey FOREIGN KEY (id_senal) REFERENCES api.senales(id_senal);

--
-- Name: fallas fallas_id_tipo_falla_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.fallas
    ADD CONSTRAINT fallas_id_tipo_falla_fkey FOREIGN KEY (id_tipo_falla) REFERENCES api.tipos_falla(id_tipo_falla);

--
-- Name: mantenimientos mantenimientos_id_estado_senal_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.mantenimientos
    ADD CONSTRAINT mantenimientos_id_estado_senal_fkey FOREIGN KEY (id_estado_senal) REFERENCES api.estados_senal(id_estado_senal);

--
-- Name: mantenimientos mantenimientos_id_senal_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.mantenimientos
    ADD CONSTRAINT mantenimientos_id_senal_fkey FOREIGN KEY (id_senal) REFERENCES api.senales(id_senal);

--
-- Name: mantenimientos mantenimientos_id_tipo_mant_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.mantenimientos
    ADD CONSTRAINT mantenimientos_id_tipo_mant_fkey FOREIGN KEY (id_tipo_mant) REFERENCES api.tipos_mantenimiento(id_tipo_mant);

--
-- Name: senales señales_id_caracteristica_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_caracteristica_fkey" FOREIGN KEY (id_caracteristica) REFERENCES api.caracteristicas(id_caracteristica);

--
-- Name: senales señales_id_categoria_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_categoria_fkey" FOREIGN KEY (id_categoria) REFERENCES api.categorias(id_categoria);

--
-- Name: senales señales_id_color_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_color_fkey" FOREIGN KEY (id_color) REFERENCES api.colores(id_color);

--
-- Name: senales señales_id_colorluz_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_colorluz_fkey" FOREIGN KEY (id_colorluz) REFERENCES api.colores_luz(id_colorluz);

--
-- Name: senales señales_id_empresa_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_empresa_fkey" FOREIGN KEY (id_empresa) REFERENCES api.empresas(id_empresa);

--
-- Name: senales señales_id_energia_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_energia_fkey" FOREIGN KEY (id_energia) REFERENCES api.energias(id_energia);

--
-- Name: senales señales_id_equipamiento_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_equipamiento_fkey" FOREIGN KEY (id_equipamiento) REFERENCES api.equipamientos_senal(id_equipamiento);

--
-- Name: senales señales_id_estacion_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_estacion_fkey" FOREIGN KEY (id_estacion) REFERENCES api.estaciones(id_estacion);

--
-- Name: senales señales_id_estado_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_estado_fkey" FOREIGN KEY (id_estado) REFERENCES api.estados(id_estado);

--
-- Name: senales señales_id_forma_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_forma_fkey" FOREIGN KEY (id_forma) REFERENCES api.formas(id_forma);

--
-- Name: senales señales_id_mar_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_mar_fkey" FOREIGN KEY (id_mar) REFERENCES api.mares(id_mar);

--
-- Name: senales señales_id_marca_tope_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_marca_tope_fkey" FOREIGN KEY (id_marca_tope) REFERENCES api.marcas_tope(id_marca_tope);

--
-- Name: senales señales_id_material_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_material_fkey" FOREIGN KEY (id_material) REFERENCES api.materiales(id_material);

--
-- Name: senales señales_id_modelo_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_modelo_fkey" FOREIGN KEY (id_modelo) REFERENCES api.modelos_senal(id_modelo);

--
-- Name: senales señales_id_tipo_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_tipo_fkey" FOREIGN KEY (id_tipo) REFERENCES api.tipos_senal(id_tipo);

--
-- Name: senales señales_id_usuario_navegacion_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_usuario_navegacion_fkey" FOREIGN KEY (id_usuario_navegacion) REFERENCES api.usuarios_navegacion(id_usuario_navegacion);

--
-- Name: senales señales_id_zona_fkey; Type: FK CONSTRAINT; Schema: api; Owner: -
--

ALTER TABLE ONLY api.senales
    ADD CONSTRAINT "señales_id_zona_fkey" FOREIGN KEY (id_zona) REFERENCES api.zonas(id_zona);

--
-- Name: usuarios_sistema usuarios_sistema_empresas_fk; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.usuarios_sistema
    ADD CONSTRAINT usuarios_sistema_empresas_fk FOREIGN KEY (id_empresa) REFERENCES api.empresas(id_empresa) ON UPDATE CASCADE ON DELETE CASCADE;
