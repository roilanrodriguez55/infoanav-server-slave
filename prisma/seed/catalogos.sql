-- Catalogos sembrados desde la base Access de SARISMA.
-- Idempotente: cada bloque inserta solo los nombres que no existen activos (sin distinguir mayusculas).
-- Ejecutar con: npm run seed (scripts/seed.ts envuelve este archivo en una transaccion).

-- Access: EMPRESAS.EMPRESAS
INSERT INTO api.empresas (nombre)
SELECT v FROM (VALUES
  ('AGENCIA NAC. ANAV'),
  ('CAMAGUEY-CIEGO'),
  ('CIENFUEGOS'),
  ('ESTUDIOS MARINOS'),
  ('MATANZAS'),
  ('ORIENTE NORTE'),
  ('ORIENTE SUR'),
  ('P. DEL RIO'),
  ('VILLA CLARA-SS')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.empresas t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: ESTACIONES.ESTACION
INSERT INTO api.estaciones (nombre)
SELECT v FROM (VALUES
  ('LOS ARROYOS'),
  ('HABANA'),
  ('CARDENAS'),
  ('ISABELA'),
  ('NUEVITAS'),
  ('PUERTO CARUPANO'),
  ('BANES'),
  ('MOA'),
  ('BOQUERON'),
  ('SANTIAGO'),
  ('MANZANILLO'),
  ('S. CRUZ DEL SUR'),
  ('PALO ALTO'),
  ('CASILDA'),
  ('CIENFUEGOS'),
  ('PLAYA LARGA'),
  ('GERONA'),
  ('MARIEL')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.estaciones t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: MODELO.MODELO
INSERT INTO api.modelos_senal (nombre)
SELECT v FROM (VALUES
  ('TORRE'),
  ('BS-41'),
  ('AGA'),
  ('ALCATRAZ'),
  ('ESQUELETO'),
  ('ICH-80'),
  ('BPL-7'),
  ('BPL-3'),
  ('MONOTUBULAR'),
  ('BY METAL'),
  ('SPAR-1'),
  ('ENFILACION'),
  ('SPAR-2'),
  ('PAREDON'),
  ('COLUMNA'),
  ('BPL7-M'),
  ('CASETA'),
  ('BMP-99'),
  ('PEDESTAL'),
  ('CILINDRICA'),
  ('BY'),
  ('CONO TRUNCADO'),
  ('ESTACON'),
  ('DE AMARRE'),
  ('ACUAFLOAT-800'),
  ('POSEIDÓN-1750'),
  ('BCP-1700')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.modelos_senal t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: ORFALLA.ORFALLA
INSERT INTO api.origenes_falla (nombre)
SELECT v FROM (VALUES
  ('SISTEMA'),
  ('VANDALISMO'),
  ('COLISION'),
  ('HURACAN'),
  ('TORNADO'),
  ('DESCARGA ELECTRICA'),
  ('EVENTO METEOROLÓGICO'),
  ('OTROS')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.origenes_falla t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: [Características].CARACTERISTICA
INSERT INTO api.caracteristicas (nombre)
SELECT v FROM (VALUES
  ('NO'),
  ('FI R 4s'),
  ('FI R 6s'),
  ('FI G 3s'),
  ('FI G 5s'),
  ('FI G 7s'),
  ('FI (2) W 10s'),
  ('LFI W 10s'),
  ('FI W 5s'),
  ('FI W 8s'),
  ('FI W 7s'),
  ('FI W 15s'),
  ('FI W 12s'),
  ('FI W 10s'),
  ('LFI W 15s'),
  ('FI (2+1) G 10s'),
  ('Q W R G'),
  ('FI (2) W 15s'),
  ('Q Y'),
  ('Iso Y 6s'),
  ('Iso W 6s'),
  ('FI (2+1) R 10s'),
  ('FI Y 7s'),
  ('FI (3) W 15s'),
  ('FI (2) W 6s'),
  ('FI W 7.5s'),
  ('FI W Mo(U) 10s'),
  ('Iso W 3s'),
  ('FI R 2s'),
  ('FI W 4s'),
  ('FI Y 3s'),
  ('FI W 6s'),
  ('Q W'),
  ('F R'),
  ('FI W 1,5s'),
  ('F W'),
  ('FI W 2s'),
  ('FI W 7,5s'),
  ('FI Y 4s'),
  ('Iso Q Y'),
  ('Iso Y'),
  ('Iso W 1,5s'),
  ('FI R 8s'),
  ('FI Y 5s'),
  ('FI W 19s'),
  ('Q (2+1) G 10s'),
  ('ISO G 1s'),
  ('ISO R 1s'),
  ('FI (2+1) R 5s'),
  ('FI W 9s'),
  ('FI R 3s')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.caracteristicas t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: ESTADO.ESTADO
INSERT INTO api.estados_senal (nombre)
SELECT v FROM (VALUES
  ('EN SERVICIO'),
  ('EN MANTENIMIENTO'),
  ('EN REPARACION'),
  ('EN RESERVA')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.estados_senal t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: UBMEDIOS.UBMEDIOS
INSERT INTO api.ubicaciones_medio (nombre)
SELECT v FROM (VALUES
  ('EN SERVICIO'),
  ('REVISION INICIAL'),
  ('EN EL TALLER P/ENVIAR A REPAR.'),
  ('EN EL TALLER DE RESERVA'),
  ('EN EL TALLER PARA REPARAR'),
  ('EN EL TALLER PARA MANTENIM.'),
  ('BAJA DEL MEDIO'),
  ('ENVIADO A REPARAR'),
  ('INICIO DEL SERV.')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.ubicaciones_medio t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Temas.[DescripciónTema]
INSERT INTO api.temas (nombre)
SELECT v FROM (VALUES
  ('PANELES SOLARES'),
  ('BOMBILLOS'),
  ('BATERIAS'),
  ('CABLES'),
  ('LINTERNAS'),
  ('LED'),
  ('BOYAS'),
  ('BALIZAS'),
  ('FAROS AUTOMÁTICOS'),
  ('FAROS CON VIGILANCIA'),
  ('ENFILACIONES'),
  ('BALIZAS FLOTANTES'),
  ('SOFTWARES'),
  ('BUQUES'),
  ('DISPONIBILIDAD'),
  ('FIABILIDAD'),
  ('TMPR'),
  ('TMEF'),
  ('COMUNICACIONES'),
  ('GPS'),
  ('MONITOREO Y CONTROL A DISTANCIA'),
  ('CADENAS'),
  ('PESOS MUERTOS'),
  ('GRILLETES'),
  ('ORGANIZACIÓN'),
  ('DETECTORES DE NIEBLA'),
  ('SEÑALIZACIÓN'),
  ('FAROS'),
  ('RADIOSEÑALES'),
  ('AVISOS A LOS NAVEGANTES'),
  ('COLIMADOR FOTOELÉCTRICO'),
  ('CANALES DE NAVEGACIÓN'),
  ('NAVEGACIÓN'),
  ('ILUMINACIÓN DIURNA'),
  ('ENERGIA EÓLICA'),
  ('DESTELLADORES'),
  ('BUQUE FARO'),
  ('BUQUE BOYERO'),
  ('RADARES'),
  ('ALCANCE GEOGRÁFICO'),
  ('ALCANCE LUMINICO'),
  ('INTENSIDAD LUMINOSA'),
  ('RADIONAVEGACIÓN'),
  ('SEÑALES DE NIEBLA'),
  ('LUCES DE SEÑALIZACIÓN'),
  ('APARATOS ÓPTICOS'),
  ('EQUIPOS DE ILUMINACIÓN'),
  ('COLISIONES'),
  ('CONSTRUCCIÓN DE MEDIOS'),
  ('CABLES ELÉCTRICOS SUBMARINOS'),
  ('AYUDA A LA NAVEGACIÓN'),
  ('SISTEMAS DE NAVEGACIÓN'),
  ('EQUIPOS DE RADIONAVEGACIÓN'),
  ('EQUIPOS ELÉCTRICOS'),
  ('EQUIPOS DE MEDICIÓN'),
  ('MEDICIONES'),
  ('RADIOFARO'),
  ('BOYAS GIGANTES'),
  ('DESLUMBRAMIENTO'),
  ('SEÑALES SECTORIALES'),
  ('VTS'),
  ('FUENTES DE ENERGIA'),
  ('GENERADORES DIESEL'),
  ('MAREAS'),
  ('SEÑALES SONORAS'),
  ('SISTEMAS DE FONDEOS'),
  ('PROTECCIÓN CONTRA DESCARGAS'),
  ('CORRIENTÓGRAFOS'),
  ('SIMULADORES'),
  ('ENERGIA OLOMOTRIZ'),
  ('COLORES DE SUPERFICIE')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.temas t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Genero.Genero
INSERT INTO api.tipos_documento (nombre)
SELECT v FROM (VALUES
  ('Consejo de la AISM'),
  ('Operaciones'),
  ('Ingeniería'),
  ('Radionavegación'),
  ('Servicio de Tráfico de Buques'),
  ('Sistemas de Información Automáticos'),
  ('Protección de Faros Históricos'),
  ('Lineamientos'),
  ('Recomendaciones'),
  ('Manuales'),
  ('Boletines de la AISM'),
  ('Catálogos'),
  ('Revistas Técnicas'),
  ('Conferencia de la AISM')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.tipos_documento t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Editorial.Editorial
INSERT INTO api.editoriales (nombre)
SELECT v FROM (VALUES
  ('GEOCUBA'),
  ('ONHG'),
  ('AISM'),
  ('EDICIONES GEO'),
  ('CUBASOLAR'),
  ('Idioma Ruso'),
  ('Arte y Literatura'),
  ('Letras Cubanas'),
  ('Instituto Cubano del Libro'),
  ('Agencia de Prensa Novosti'),
  ('Pueblo y Educación'),
  ('Ciencias Sociales'),
  ('Pablo de la Torriente'),
  ('Editorial Nacional de Cuba'),
  ('Ediciones Revolución'),
  ('Casa de las Américas'),
  ('Mir'),
  ('Universidad de la Habana'),
  ('Editora Pedagógica'),
  ('Raduga'),
  ('Casa Editorial Islámica Internacional'),
  ('Imprenta Central de las FAR'),
  ('Oficina de Publicaciones del Consejo de Estado'),
  ('SRL'),
  ('Extramuros'),
  ('UNEAC'),
  ('Orbis'),
  ('Orbe'),
  ('Holland Enterprises LTD'),
  ('Siglo XXI'),
  ('Oriente'),
  ('Naika'),
  ('Granma'),
  ('Científico - Técnica'),
  ('Alfred Holz'),
  ('Consejo Nacional de Cultura'),
  ('Capitán San Luis'),
  ('REDE'),
  ('Alarcos'),
  ('Nuevo Mundo'),
  ('Ediciones en Lenguas Extranjeras'),
  ('Magnus Edizioni'),
  ('Biblioteca del Pueblo'),
  ('Publicaciones Económicas'),
  ('Consejo Nacional de Universidades'),
  ('Edebé'),
  ('Interpress'),
  ('ABC'),
  ('Editora Militar'),
  ('Messidor'),
  ('Claringhouse'),
  ('IBM'),
  ('UPM'),
  ('Diógenes S.A.'),
  ('Unión de escritores angolanos'),
  ('Venceremos'),
  ('Mundo Hispano'),
  ('Verde Olivo'),
  ('ICGC'),
  ('Oficina del historiador de la ciudad'),
  ('Universal'),
  ('David Mc Kay'),
  ('Academia Naval Granma'),
  ('Madrid')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.editoriales t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Idioma.Idioma
INSERT INTO api.idiomas (nombre)
SELECT v FROM (VALUES
  ('Español'),
  ('Inglés'),
  ('Ruso'),
  ('Francés'),
  ('Portugués'),
  ('Italiano'),
  ('Arabe'),
  ('Alemán'),
  ('Polaco'),
  ('Checo'),
  ('Eslovaco'),
  ('Búlgaro'),
  ('Vietnamita')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.idiomas t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Paises.Pais
INSERT INTO api.paises (nombre)
SELECT v FROM (VALUES
  ('Cuba'),
  ('Francia'),
  ('Reino Unido'),
  ('España'),
  ('Italia'),
  ('Estados Unidos'),
  ('Canadá'),
  ('Suecia'),
  ('República Federal Alemana'),
  ('Japón'),
  ('India'),
  ('Escocia'),
  ('Irlanda'),
  ('Holanda'),
  ('Australia'),
  ('Argentina'),
  ('URSS'),
  ('Nueva Zelandia'),
  ('Polonia'),
  ('Indonesia'),
  ('Bélgica'),
  ('Finlandia'),
  ('Noruega'),
  ('Singapur')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.paises t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Tabla Misiones del Buque ([ID Misión], [Misión])
INSERT INTO api.misiones_buque (nombre, codigo)
SELECT x.nombre, x.codigo FROM (VALUES
  ('Ayuda a la Navegación', 'AN'),
  ('Trabajos Hidrográficos', 'TH'),
  ('Trabajos Oceanográficos', 'TO'),
  ('Otras Tareas', 'OT')
) AS x(nombre, codigo)
WHERE NOT EXISTS (SELECT 1 FROM api.misiones_buque t WHERE lower(t.nombre) = lower(x.nombre) AND t.deleted_at IS NULL);

-- Access: Senmar.COLOR
INSERT INTO api.colores (nombre)
SELECT v FROM (VALUES
  ('AMARILLA'),
  ('BLANCA Y ROJA'),
  ('VERDE'),
  ('ROJA'),
  ('BLANCA'),
  ('ALUMINIO'),
  ('AMARILLA Y ROJA'),
  ('AMARILLA Y NEGRA'),
  ('ROJA Y NEGRA')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.colores t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.FORMA
INSERT INTO api.formas (nombre)
SELECT v FROM (VALUES
  ('TORRE'),
  ('CONICA'),
  ('SPAR'),
  ('CASTILLETE'),
  ('MONOTUBULAR'),
  ('ESQUELETO'),
  ('CILINDRICA'),
  ('ESTACON')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.formas t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.MATERIAL
INSERT INTO api.materiales (nombre)
SELECT v FROM (VALUES
  ('SILLERIA'),
  ('PLASTICO'),
  ('METAL')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.materiales t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.MAR
INSERT INTO api.mares (nombre)
SELECT v FROM (VALUES
  ('ABIERTO'),
  ('SEMIABIERTO'),
  ('CERRADO')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.mares t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.TIENER
INSERT INTO api.energias (nombre)
SELECT v FROM (VALUES
  ('MOTOR DIESEL'),
  ('FOTOVOLTAICA')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.energias t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.MTOP
INSERT INTO api.marcas_tope (nombre)
SELECT v FROM (VALUES
  ('ESFERA'),
  ('CILINDRICA'),
  ('CONICA'),
  ('DOS ESFERAS SUPERPUESTAS')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.marcas_tope t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.CATEG
INSERT INTO api.categorias (nombre)
SELECT v FROM (VALUES
  ('1A'),
  ('2A'),
  ('3A'),
  ('2B'),
  ('2C'),
  ('1B'),
  ('3B'),
  ('3C'),
  ('2D')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.categorias t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.COLUZ
INSERT INTO api.colores_luz (nombre)
SELECT v FROM (VALUES
  ('BLANCA'),
  ('VERDE'),
  ('ROJA')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.colores_luz t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.COMPL
INSERT INTO api.complejidades (nombre)
SELECT v FROM (VALUES
  ('A'),
  ('B'),
  ('C')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.complejidades t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.ESTADO y nombres de api.get_dashboard_stats
INSERT INTO api.estados (nombre)
SELECT v FROM (VALUES
  ('BUENO'),
  ('Operativa'),
  ('Fuera de Servicio'),
  ('Pendiente de Reparación'),
  ('Desactivada'),
  ('En Pruebas'),
  ('En Instalación')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.estados t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: FALLA.TFALL
INSERT INTO api.tipos_falla (nombre)
SELECT v FROM (VALUES
  ('APAGADA'),
  ('LUZ NO CONFIABLE'),
  ('SOLTO AMARRAS'),
  ('DAÑADA'),
  ('DESTRUIDA'),
  ('FUERA DE CARACTERIST'),
  ('FUERA DE CARACTERISTICA'),
  ('CORRIDA DE POSICION'),
  ('LUZ FIJA'),
  ('INSUFICIENCIA'),
  ('FALTA EN EL LUGAR'),
  ('HUNDIDA'),
  ('POCA INTENSIDAD'),
  ('SEMIHUNDIDA'),
  ('RETIRADA DEL SERV. TEMPORALMENTE')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.tipos_falla t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Mant1.T_MANT
INSERT INTO api.tipos_mantenimiento (nombre)
SELECT v FROM (VALUES
  ('SUS'),
  ('RL'),
  ('MO'),
  ('SP'),
  ('LMF'),
  ('REC'),
  ('REP'),
  ('MT')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.tipos_mantenimiento t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: ALIST EMBARC.[Tipo de Alist]
INSERT INTO api.tipos_alistamiento (nombre)
SELECT v FROM (VALUES
  ('Listo "A(L)"'),
  ('Listo "V"'),
  ('Listo "R"'),
  ('Listo "A"'),
  ('Listo "E"')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.tipos_alistamiento t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Access: Senmar.ZONA (sin tabla de nombres en Access; generado)
INSERT INTO api.zonas (nombre)
SELECT v FROM (VALUES
  ('Zona 1')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.zonas t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);

-- Equipamiento de Senmar: nombres tomados de las columnas de equipamiento de Senmar (diseño de Sarisma), no de una tabla de catalogo de Access.
INSERT INTO api.tipos_equipamiento (nombre)
SELECT v FROM (VALUES
  ('Destellador'),
  ('Cambialámparas'),
  ('Panel solar'),
  ('Batería'),
  ('Bombillo'),
  ('Linterna'),
  ('Linterna auxiliar'),
  ('Estructura')
) AS x(v)
WHERE NOT EXISTS (SELECT 1 FROM api.tipos_equipamiento t WHERE lower(t.nombre) = lower(x.v) AND t.deleted_at IS NULL);
