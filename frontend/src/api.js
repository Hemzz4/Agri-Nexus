import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', // Use IP to avoid localhost IPv6 issues
    headers: {
        'Content-Type': 'application/json',
    },
});

export const predictWeather = async (district, year, month) => {
    try {
        const response = await api.post('/predict/weather', {
            district,
            year: parseInt(year),
            month: parseInt(month),
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

export const fetchWeather = async (lat, lon) => {
    try {
        const response = await api.get(`/weather/`, {
            params: { latitude: lat, longitude: lon }
        });
        return response.data;
    } catch (error) {
        console.error("Weather API Error:", error);
        throw error;
    }
};

export const fetchHistoricalWeather = async (lat, lon, startDate, endDate) => {
    try {
        const response = await api.get(`/weather/history`, {
            params: {
                latitude: lat,
                longitude: lon,
                start_date: startDate,
                end_date: endDate
            }
        });
        return response.data;
    } catch (error) {
        console.error("Historical Weather API Error:", error);
        throw error;
    }
};

export const predictAdvisory = async (text) => {
    try {
        const response = await api.post('/api/nlp/advisory', { text });
        return response.data;
    } catch (error) {
        console.error("Advisory API Error:", error);
        throw error;
    }
};

export const extractPestAndCrop = async (text) => {
    try {
        const response = await api.post('/api/nlp/extract-pest-crop', { text });
        return response.data;
    } catch (error) {
        console.error('Pest & Crop Extraction API Error:', error);
        throw error;
    }
};

export const predictSentiment = async (text) => {
    try {
        const response = await api.post('/api/nlp/sentiment', { text });
        return response.data;
    } catch (error) {
        console.error('Error fetching NLP prediction:', error);
        throw error;
    }
};

export const fetchNlpAnalytics = async () => {
    try {
        const response = await api.get('/api/nlp/analytics');
        return response.data;
    } catch (error) {
        console.error('Error fetching NLP analytics:', error);
        throw error;
    }
};

export const extractNgrams = async (documents) => {
    try {
        const response = await api.post('/api/nlp/ngrams', { documents });
        return response.data;
    } catch (error) {
        console.error('Error fetching N-grams:', error);
        throw error;
    }
};

export const clusterDocuments = async (documents, num_clusters = 2) => {
    try {
        const response = await api.post('/api/nlp/clustering', { documents, num_clusters });
        return response.data;
    } catch (error) {
        console.error('Error clustering documents:', error);
        throw error;
    }
};

export const analyzeLexical = async (text) => {
    try {
        const response = await api.post('/api/nlp/lexical-analysis', { text });
        return response.data;
    } catch (error) {
        console.error('Error fetching lexical analysis:', error);
        throw error;
    }
};

export const extractTopics = async (documents, num_topics = 3) => {
    try {
        const response = await api.post('/api/nlp/topic-modeling', { documents, num_topics });
        return response.data;
    } catch (error) {
        console.error('Error fetching topics:', error);
        throw error;
    }
};

export const summarizeText = async (text, num_sentences = 3) => {
    try {
        const response = await api.post('/api/nlp/summarize', { text, num_sentences });
        return response.data;
    } catch (error) {
        console.error('Error fetching summary:', error);
        throw error;
    }
};

export const findSimilarQueries = async (text) => {
    try {
        const response = await api.post('/api/nlp/similar-queries', { text });
        return response.data;
    } catch (error) {
        console.error('Error fetching similar queries:', error);
        throw error;
    }
};

export const extractEntities = async (text) => {
    try {
        const response = await api.post('/api/nlp/ner', { text });
        return response.data;
    } catch (error) {
        console.error('Error fetching entities:', error);
        throw error;
    }
};

export const generateAIInsight = async (district, parameter, value, year) => {
    try {
        const response = await fetch('http://127.0.0.1:8000/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ district, parameter, value: parseFloat(value), year: year ? String(year) : null }),
        });
        
        if (!response.ok) throw new Error("AI Insight API Error");
        return response; // Return the fetch response so the component can read the stream
    } catch (error) {
        console.error('Error generating AI insight:', error);
        throw error;
    }
};

export const fetchYieldData = async () => {
    try {
        const response = await api.get('/analytics/yield-data');
        return response.data;
    } catch (error) {
        console.error('Error fetching yield data:', error);
        throw error;
    }
};

export const fetchAnalyticsWeatherData = async () => {
    try {
        const response = await api.get('/analytics/weather-data');
        return response.data;
    } catch (error) {
        console.error('Error fetching analytics weather data:', error);
        throw error;
    }
};

export default api;
