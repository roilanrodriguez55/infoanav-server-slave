import api from '../config/axiosConfig';

export const catalogosService = {
  // Tipos de Señal
  createTipo: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/tipos-senal', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando tipo:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el tipo');
    }
  },

  // Categorías
  createCategoria: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/categorias', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando categoría:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la categoría');
    }
  },

  // Modelos
  createModelo: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/modelos-senal', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando modelo:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el modelo');
    }
  },

  // Empresas
  createEmpresa: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/empresas', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando empresa:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la empresa');
    }
  },

  // Estaciones
  createEstacion: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/estaciones', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando estación:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la estación');
    }
  },

  // Usuarios de navegación
  createUsuarioNavegacion: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/usuarios-navegacion', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el usuario');
    }
  },

  // Zonas
  createZona: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/zonas', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando zona:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la zona');
    }
  },

  // Estados
  createEstado: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/estados', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando estado:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el estado');
    }
  },

  // Materiales
  createMaterial: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/materiales', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando material:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el material');
    }
  },

  // Energías
  createEnergia: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/energias', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando energía:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la energía');
    }
  },

  // Marcas de Tope
  createMarcaTope: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/marcas-tope', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando marca de tope:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la marca de tope');
    }
  },

  // Colores
  createColor: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/colores', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando color:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el color');
    }
  },

  // Formas
  createForma: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/formas', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando forma:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la forma');
    }
  },

  // Mares
  createMar: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/mares', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando mar:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el mar');
    }
  },

  // Colores de Luz
  createColorLuz: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/colores-luz', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando color de luz:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el color de luz');
    }
  },

  // Características
  createCaracteristica: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/caracteristicas', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando característica:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la característica');
    }
  },

  // Tipos de Equipamiento
  createTipoEquipamiento: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/tipos-equipamiento', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando tipo de equipamiento:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el tipo de equipamiento');
    }
  },

  createTipoFalla: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/tipos-falla', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando tipo de falla:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el tipo de falla');
    }
  },

  createOrigenFalla: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/origenes-falla', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando origen de falla:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el origen de falla');
    }
  },

  createTipoMantenimiento: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/tipos-mantenimiento', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando tipo de mantenimiento:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el tipo de mantenimiento');
    }
  },

  createEstadoSenal: async (nombre: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.post('/estados-senal', {
        nombre,
        createat: new Date().toISOString(),
        createby: user?.usuario || 'sistema'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creando estado de señal:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el estado de señal');
    }
  }
};