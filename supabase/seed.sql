-- Seed data para desarrollo local
-- Coordenadas reales en el área de Asunción, Paraguay
-- Imágenes de Unsplash (públicas, sin autenticación)

INSERT INTO murales (nombre, candidato, url_maps, comentario, imagen_url, imagen_thumbnail_url, estado) VALUES

-- Murales aprobados (5)
(
  'Ruta 1 km 12, Luque',
  'Fulano De Tal - Partido Colorado',
  'https://www.google.com/maps?q=-25.2670,-57.4822',
  'Mural grande sobre pared de hormigón, visible desde la ruta',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=300',
  'aprobado'
),
(
  'Av. España 1200, Asunción',
  'Mengano XYZ - PLRA',
  'https://www.google.com/maps?q=-25.2820,-57.6350',
  'Mural en medianera de edificio comercial',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300',
  'aprobado'
),
(
  'San Lorenzo Centro',
  'Perengano ABC - PEN',
  'https://www.google.com/maps?q=-25.3320,-57.5020',
  null,
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=300',
  'aprobado'
),
(
  'Luque km 18',
  'Candidato Independiente',
  'https://www.google.com/maps?q=-25.2780,-57.4910',
  'Mural pintado sobre barda de chapa',
  'https://images.unsplash.com/photo-1551913902-c92207136625?w=800',
  'https://images.unsplash.com/photo-1551913902-c92207136625?w=300',
  'aprobado'
),
(
  'Fernando de la Mora, calle Mcal. López',
  'Partido Colorado - Lista 1',
  'https://www.google.com/maps?q=-25.3390,-57.5510',
  'Mural doble cara en esquina céntrica',
  'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800',
  'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=300',
  'aprobado'
),

-- Murales pendientes (3)
(
  'Capiatá, Ruta Transchaco',
  'Sin identificar',
  'https://www.google.com/maps?q=-25.3610,-57.4470',
  'Mural sin candidato visible, solo logo de partido',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300',
  'pendiente'
),
(
  'Ñemby km 5',
  'Fulana De Tal - PLRA',
  'https://www.google.com/maps?q=-25.3880,-57.5280',
  null,
  'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800',
  'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=300',
  'pendiente'
),
(
  'Villa Elisa centro',
  'Lista 400 - Colorado',
  'https://www.google.com/maps?q=-25.3990,-57.6020',
  'Mural reciente, pintado sobre mural anterior',
  'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=800',
  'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=300',
  'pendiente'
),

-- Mural rechazado (1)
(
  'Entrada duplicada - test',
  'Test',
  'https://www.google.com/maps?q=-25.3085,-57.6056',
  'Entrada de prueba rechazada por duplicado',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300',
  'rechazado'
);

-- Murales con modificación pendiente (2) — insertar modificaciones relacionadas
-- Primero insertar los murales base
INSERT INTO murales (id, nombre, candidato, url_maps, comentario, imagen_url, imagen_thumbnail_url, estado) VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Itauguá km 30',
  'Partido X - Lista 2',
  'https://www.google.com/maps?q=-25.3960,-57.3590',
  'Mural modificado recientemente',
  'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800',
  'https://images.unsplash.com/photo-1549490349-8643362247b5?w=300',
  'modificado_pendiente'
),
(
  'a1b2c3d4-0000-0000-0000-000000000002',
  'Lambaré, Av. Artigas',
  'PLRA - Candidato Local',
  'https://www.google.com/maps?q=-25.3490,-57.6120',
  null,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
  'modificado_pendiente'
);

-- Solicitudes de modificación para los murales anteriores
INSERT INTO mural_modificaciones (mural_id, nueva_imagen_url, nueva_imagen_thumbnail_url, nuevo_comentario, estado_solicitud) VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=300',
  'El mural fue ampliado, ahora ocupa toda la pared lateral',
  'pendiente'
),
(
  'a1b2c3d4-0000-0000-0000-000000000002',
  'https://images.unsplash.com/photo-1565799557186-4c66a3b9e8d8?w=800',
  'https://images.unsplash.com/photo-1565799557186-4c66a3b9e8d8?w=300',
  'Mural fue repintado con otro candidato encima',
  'pendiente'
);
