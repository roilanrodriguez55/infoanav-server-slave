-- Modelos de equipo sembrados desde la base Access de SARISMA.
-- Solo catalogos de modelos: no migra equipos con numero de inventario, senales ni datos de personas.
-- Idempotente: cada bloque inserta solo los nombres que no existen activos para ese tipo (sin distinguir mayusculas).
-- Ejecutar con: npm run seed (scripts/seed.ts envuelve este archivo en una transaccion).

-- Access: Baterías (TIPO DE BATERIA -> nombre, NACIONALIDAD -> pais) -> tipo 'Batería'
INSERT INTO api.modelos_equipo (id_tipo_equipamiento, nombre, pais)
SELECT t.id_tipo_equipamiento, x.nombre, x.pais
FROM (VALUES
  ('YUASA 6V-160A', 'CHINA'),
  ('TAINO 12V180A', 'CUBA'),
  ('YUASA 12V40A', 'CHINA'),
  ('YUASA 12V 38A', 'CHINA'),
  ('YUASA 12V 78A', 'CHINA'),
  ('MEGO 12 V 75A', 'CHINA'),
  ('DINAMIN 12V 95A', 'CHINA'),
  ('CB- 65-12', 'CHINA'),
  ('HZY-MR 12V 110A', NULL),
  ('RITAR', NULL),
  ('LS- QUALITY', NULL),
  ('CRISTAR 12V 90A', NULL),
  ('LUCAS 12V 75A', NULL)
) AS x(nombre, pais)
JOIN api.tipos_equipamiento t ON lower(t.nombre) = lower('Batería') AND t.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM api.modelos_equipo m
  WHERE m.id_tipo_equipamiento = t.id_tipo_equipamiento AND lower(m.nombre) = lower(x.nombre) AND m.deleted_at IS NULL
);

-- Access: Tdest (DEST -> nombre, NACIONALIDAD -> pais, CONSUMO -> consumo) -> tipo 'Destellador'
INSERT INTO api.modelos_equipo (id_tipo_equipamiento, nombre, pais, consumo)
SELECT t.id_tipo_equipamiento, x.nombre, x.pais, x.consumo
FROM (VALUES
  ('BEPA-6/12', 'URSS', '3.14 AH'),
  ('BEPA-2', 'URSS', NULL),
  ('BEPA-306', 'URSS', '0.43 AH'),
  ('BEPA-312', 'URSS', NULL),
  ('STONE CHANCE', 'U.K.', NULL),
  ('DS-10', 'CUBA', NULL),
  ('FU-839', NULL, NULL),
  ('ESL-3', 'RDA', '1.7 AH'),
  ('R-DS-10', NULL, '0.38 AH'),
  ('EKSA 421', NULL, '0.38 AH'),
  ('MM-3', NULL, NULL),
  ('MM-1500', NULL, NULL),
  ('ACA-500', NULL, NULL),
  ('EKFA', NULL, NULL),
  ('BSO', NULL, NULL),
  ('X ANIV.', 'CUBA', NULL),
  ('GRSO-60', NULL, NULL),
  ('FA-89', NULL, NULL),
  ('DS-46', 'CUBA', '0.46 AH'),
  ('ESL-40', 'CUBA', '0.8 AH'),
  ('MAQUINA DE ROTACION', 'FRANCIA', NULL),
  ('DS-100', 'CUBA', NULL),
  ('LED ITALIANO', 'ITALIA', NULL),
  ('DMC-98', 'CUBA', NULL)
) AS x(nombre, pais, consumo)
JOIN api.tipos_equipamiento t ON lower(t.nombre) = lower('Destellador') AND t.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM api.modelos_equipo m
  WHERE m.id_tipo_equipamiento = t.id_tipo_equipamiento AND lower(m.nombre) = lower(x.nombre) AND m.deleted_at IS NULL
);

-- Access: Linte (TLINT -> nombre) -> tipo 'Linterna'
INSERT INTO api.modelos_equipo (id_tipo_equipamiento, nombre)
SELECT t.id_tipo_equipamiento, x.nombre
FROM (VALUES
  ('140 MM SOV'),
  ('150 MM LBEP'),
  ('150 MM WT'),
  ('200 MM AGA'),
  ('200 MM BBT'),
  ('200 MM CUBANA'),
  ('300 MM D.LENTE'),
  ('200 MM ESL-3'),
  ('200 MM SOV'),
  ('200 MM STONE'),
  ('200 MM WT'),
  ('200 MM ZP20'),
  ('300 MM AGA'),
  ('300 MM JAPON'),
  ('300 MM SOV'),
  ('300 MM STONE'),
  ('375 MM AGA'),
  ('500 MM AGA'),
  ('500 MM SOV'),
  ('ACA-500'),
  ('LS-2'),
  ('ZL-251'),
  ('ZLRB'),
  ('Dir BBT SECT.'),
  ('Dir BBT 300 MM'),
  ('Dir CUBANA'),
  ('Dir FA-47'),
  ('Dir EMGU SOV'),
  ('Dir 120 MM SOV'),
  ('Dir 210 MM SOV'),
  ('Dir STONE CH.'),
  ('Dir STONE SECT'),
  ('300 MM BBT'),
  ('375 MM BBT'),
  ('EM 200 SOV'),
  ('120 MM AGA'),
  ('180 MM BBT'),
  ('700 MM BBT'),
  ('250 MM BBT'),
  ('500 MM BBT'),
  ('200 MM USA'),
  ('CARMANAH 601'),
  ('CARMANAH 701'),
  ('SL-60'),
  ('SL-70 GPS'),
  ('APOLLO SL-155'),
  ('900mm'),
  ('SL300-2D5-2W'),
  ('SL 300-2D5-132W'),
  ('SL 155-100-18W'),
  ('MCL- 140'),
  ('MBL- 150'),
  ('MCL-100'),
  ('MCL-160'),
  ('MCL-120'),
  ('MBL-160'),
  ('MLL 1000')
) AS x(nombre)
JOIN api.tipos_equipamiento t ON lower(t.nombre) = lower('Linterna') AND t.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM api.modelos_equipo m
  WHERE m.id_tipo_equipamiento = t.id_tipo_equipamiento AND lower(m.nombre) = lower(x.nombre) AND m.deleted_at IS NULL
);

-- Access: Linte (TLINT -> nombre) -> tipo 'Linterna auxiliar' (misma tabla que LINT; las senales LUZAUX la usan)
INSERT INTO api.modelos_equipo (id_tipo_equipamiento, nombre)
SELECT t.id_tipo_equipamiento, x.nombre
FROM (VALUES
  ('140 MM SOV'),
  ('150 MM LBEP'),
  ('150 MM WT'),
  ('200 MM AGA'),
  ('200 MM BBT'),
  ('200 MM CUBANA'),
  ('300 MM D.LENTE'),
  ('200 MM ESL-3'),
  ('200 MM SOV'),
  ('200 MM STONE'),
  ('200 MM WT'),
  ('200 MM ZP20'),
  ('300 MM AGA'),
  ('300 MM JAPON'),
  ('300 MM SOV'),
  ('300 MM STONE'),
  ('375 MM AGA'),
  ('500 MM AGA'),
  ('500 MM SOV'),
  ('ACA-500'),
  ('LS-2'),
  ('ZL-251'),
  ('ZLRB'),
  ('Dir BBT SECT.'),
  ('Dir BBT 300 MM'),
  ('Dir CUBANA'),
  ('Dir FA-47'),
  ('Dir EMGU SOV'),
  ('Dir 120 MM SOV'),
  ('Dir 210 MM SOV'),
  ('Dir STONE CH.'),
  ('Dir STONE SECT'),
  ('300 MM BBT'),
  ('375 MM BBT'),
  ('EM 200 SOV'),
  ('120 MM AGA'),
  ('180 MM BBT'),
  ('700 MM BBT'),
  ('250 MM BBT'),
  ('500 MM BBT'),
  ('200 MM USA'),
  ('CARMANAH 601'),
  ('CARMANAH 701'),
  ('SL-60'),
  ('SL-70 GPS'),
  ('APOLLO SL-155'),
  ('900mm'),
  ('SL300-2D5-2W'),
  ('SL 300-2D5-132W'),
  ('SL 155-100-18W'),
  ('MCL- 140'),
  ('MBL- 150'),
  ('MCL-100'),
  ('MCL-160'),
  ('MCL-120'),
  ('MBL-160'),
  ('MLL 1000')
) AS x(nombre)
JOIN api.tipos_equipamiento t ON lower(t.nombre) = lower('Linterna auxiliar') AND t.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM api.modelos_equipo m
  WHERE m.id_tipo_equipamiento = t.id_tipo_equipamiento AND lower(m.nombre) = lower(x.nombre) AND m.deleted_at IS NULL
);

-- Access: Paneles (PANEL -> nombre, PAIS -> pais) -> tipo 'Panel solar'
INSERT INTO api.modelos_equipo (id_tipo_equipamiento, nombre, pais)
SELECT t.id_tipo_equipamiento, x.nombre, x.pais
FROM (VALUES
  ('ZK-18M 100', 'JAPON'),
  ('ZK-36M 210 (12V-21W)', 'JAPON'),
  ('ZK-36M 450 (12V-45W)', 'JAPON'),
  ('Disolar (12V-45W)', 'JAPON'),
  ('SOVIETICO', 'URSS'),
  ('STONE CHANCE(R)', 'REINO UNIDO'),
  ('STONE CHANCE(L)', 'REINO UNIDO'),
  ('LCT-1236', 'CUBA'),
  ('BPX-47A', NULL),
  ('LCT-0609', 'CUBA'),
  ('LCT-0616', 'CUBA'),
  ('LCT-1216', 'CUBA'),
  ('ITALIANO', 'ITALIA'),
  ('LCT-1209', 'CUBA'),
  ('BSR-10', 'URSS'),
  ('LCT-0618', 'CUBA'),
  ('LCT-0608', 'CUBA'),
  ('LCT-1218', 'CUBA'),
  ('PHOENIX B-108-D 12V14W', 'ITALIA'),
  ('PHOENIX 12V10W', 'ITALIA'),
  ('LCT-1208', 'CUBA'),
  ('PHOENIX 12V04W', 'ITALIA'),
  ('EUROSOLAR 12V10W', 'ITALIA'),
  ('HELIOS 12V12W', 'ITALIA'),
  ('Fotovoltaico (12V-22W)', 'CUBA'),
  ('ISOFOTÓN (12V-50W)', 'CUBA'),
  ('LACETEL (12V - 36 W)', 'CUBA'),
  ('DSM- 46', 'CUBA'),
  ('PPS-170 12V 170W', NULL),
  ('HSM 12V-50W', NULL),
  ('I-22 DCB', NULL),
  ('SLP-140 (12V- 140W)', NULL),
  ('SLP-90 (12V- 90W)', NULL),
  ('SSP (12V-60W)', NULL),
  ('SPM (12V-50W)', NULL),
  ('HSM (12V-60W)', NULL),
  ('DSM (12V-40A)', NULL),
  ('SPP (12V-140)', NULL)
) AS x(nombre, pais)
JOIN api.tipos_equipamiento t ON lower(t.nombre) = lower('Panel solar') AND t.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM api.modelos_equipo m
  WHERE m.id_tipo_equipamiento = t.id_tipo_equipamiento AND lower(m.nombre) = lower(x.nombre) AND m.deleted_at IS NULL
);

-- Access: Bombillo (CARACTBOMB -> nombre, VOLTBOMB -> voltaje, WATTBOMB -> vatios) -> tipo 'Bombillo'
INSERT INTO api.modelos_equipo (id_tipo_equipamiento, nombre, voltaje, vatios)
SELECT t.id_tipo_equipamiento, x.nombre, x.voltaje, x.vatios
FROM (VALUES
  ('6V/6W', 6, 6),
  ('12V/12W', 12, 12),
  ('127V/1500W', 127, 1500),
  ('12 V/20W', 12, 20),
  ('10.3V/10.3W', 10.3, 10.3),
  ('12V/10W', 12, 10),
  ('12V/6W', 12, 6),
  ('12V/36W', 12, 36),
  ('12V/100W', 12, 100),
  ('220V/1000W', 220, 1000),
  ('10.3V/40W', 10.3, 40),
  ('6V/10W', 6, 10),
  ('10.3V/20', 10.3, 20),
  ('110V/1500W', 110, 1500),
  ('10.5V/40W', 10.5, 40),
  ('10.5V/60W', 10.5, 60),
  ('110V/1000W', 110, 1000),
  ('12V/60W', 12, 60),
  ('LED', NULL, NULL),
  ('12V/24W', 12, 24),
  ('12V/50W', 12, 50)
) AS x(nombre, voltaje, vatios)
JOIN api.tipos_equipamiento t ON lower(t.nombre) = lower('Bombillo') AND t.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM api.modelos_equipo m
  WHERE m.id_tipo_equipamiento = t.id_tipo_equipamiento AND lower(m.nombre) = lower(x.nombre) AND m.deleted_at IS NULL
);

-- Ubicaciones de medio: fuera de servicio solo para EN SERVICIO e INICIO DEL SERV. (el resto queda en true por defecto)
UPDATE api.ubicaciones_medio
SET fuera_servicio = false
WHERE lower(nombre) IN ('en servicio', 'inicio del serv.');
