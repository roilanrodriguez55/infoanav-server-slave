# Documentacion de INFOANAV

Esta carpeta reune la documentacion del sistema completo: servidor (gateway Node, PostgREST y PostgreSQL) y cliente (`client/`).

## Guia tecnica (`tecnica/`)

Para quien instala, configura o mantiene el sistema. El servidor va primero, luego el cliente.

1. [Arranque rapido](tecnica/01-arranque-rapido.md): levantar todo el sistema desde cero, con Docker o a mano.
2. [Servidor avanzado](tecnica/02-servidor-avanzado.md): variables, autenticacion, permisos, PostgREST, produccion, migraciones y backups.
3. [Cliente avanzado](tecnica/03-cliente-avanzado.md): variables de Vite, build, nginx, dominios separados, pruebas e2e.

## Manual de usuario (`manual-usuario/`)

Para quien usa la aplicacion dia a dia. Empieza por el [indice del manual](manual-usuario/README.md): acceso, flujo general de la aplicacion, roles y una guia por modulo.
