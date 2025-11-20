import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const getLLMModel = () => {
    const llm = createOpenAICompatible({
        name: 'llm',
        baseURL: process.env.LLM_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: process.env.LLM_API_KEY,
    })

    return llm(process.env.LLM_MODEL_NAME || "doubao-seed-1-6-251015")
}

export const getEmbeddingLLMModel = () => {
    const embedding = createOpenAICompatible({
        name: 'embedding',
        baseURL: process.env.EMBEDDING_BASE_URL || 'https://api.siliconflow.cn/v1',
        apiKey: process.env.EMBEDDING_API_KEY,
    })

    return embedding(process.env.EMBEDDING_MODEL_NAME || "BAAI/bge-m3")
}
