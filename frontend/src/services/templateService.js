import api from './api';

const templateService = {
    getTemplates: async (type) => {
        const response = await api.get('/templates', { params: { type } });
        return response.data;
    },
    createTemplate: async (templateData) => {
        const response = await api.post('/templates', templateData);
        return response.data;
    },
    deleteTemplate: async (id) => {
        const response = await api.delete(`/templates/${id}`);
        return response.data;
    }
};

export default templateService;
