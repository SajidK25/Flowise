import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams, PromptTemplate  } from '../../../src/Interface'
import { getBaseClasses, handleEscapeCharacters, getInputVariables,getCredentialData, getCredentialParam } from '../../../src/utils'
import { LLMChain } from 'langchain/chains'
import { BaseLanguageModel } from 'langchain/base_language'
import { ConsoleCallbackHandler, CustomChainHandler, additionalCallbacks } from '../../../src/handler'
import { Pool } from 'pg'
import { PromptTemplateInput } from 'langchain/prompts'

class PostgressManger_Chains implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    baseClasses: string[]
    description: string
    inputs: INodeParams[]
    credential: INodeParams
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Postgres Manager'
        this.name = 'postgresChain'
        this.version = 1.0
        this.type = 'LLMChain'
        this.icon = 'chain.svg'
        this.category = 'Chains'
        this.description = 'Chain to run queries against LLMs'
        this.baseClasses = [this.type, ...getBaseClasses(LLMChain)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresApi']
        };
        this.inputs = [
            {
                label: 'Host',
                name: 'host',
                type: 'string',
                placeholder: 'localhost',
                optional: true
            },
            {
                label: 'Database Name',
                name: 'databaseName',
                type: 'string',
                placeholder: 'postgres',
                optional: true
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                placeholder: '5432',
                optional: true
            },
            {
                label: 'Table Name',
                name: 'tableName',
                type: 'string',
                optional: true

            },
            {
                label: 'Template',
                name: 'template',
                type: 'string',
                rows: 4,
                placeholder: `What is a good name for a company that makes {product}?`
            },
            {
                label: 'Format Prompt Values',
                name: 'promptValues',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true
            },
            {
                label: 'Columns',
                name: 'columnToSelect',
                type: 'string',
                rows: 4,
                placeholder: 'pipeline_name, project_id, chat_flow_id, results, last_update',
            },
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Prompt',
                name: 'prompt',
                type: 'BasePromptTemplate'
                
            },
            {
                label: 'Chain Name',
                name: 'chainName',
                type: 'string',
                placeholder: 'Name Your Chain',
                optional: true
            },
            {
                
                label: 'QUERY',
                name: 'queryToSend',
                type : 'options',
                options: [
                    {
                        label: 'INSERT',
                        name: 'INSERT'
                    },
                    {
                        label: 'SELECT',
                        name: 'SELECT'
                    }
                ],
                default: 'INSERT',
                placeholder: 'INSERT'

            }
        ]
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const model = nodeData.inputs?.model as BaseLanguageModel
        const prompt = nodeData.inputs?.prompt
        const chain = new LLMChain({ llm: model, prompt, verbose: process.env.DEBUG === 'true' ? true : false })
        return chain

    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string> {
        const inputVar = nodeData.instance.prompt.inputVariables as string[] // ["product"]
        const chain = nodeData.instance as LLMChain
        const promptValues = nodeData.inputs?.prompt.promptValues as ICommonObject
        const res = await runPrediction(inputVar, chain, input, promptValues, options, nodeData)


        /** -------variable for data base ------------ */
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const user = getCredentialParam('user', credentialData, nodeData)
        const password = getCredentialParam('password', credentialData, nodeData)
        const tableName = nodeData.inputs?.tableName || 'pipeline' as string
        const columns = nodeData.inputs?.columns || 'pipeline_name, project_id, chat_flow_id, results, last_update' as string
        const query = nodeData.inputs?.queryToSend as string
        const chainName = nodeData.inputs?.chainName as string


        const postgresConnectionOptions  = {
            type: 'postgres',
            host: nodeData.inputs?.host || 'localhost',
            port: nodeData.inputs?.port || '5432',
            username: user,
            password: password,
            database: nodeData.inputs?.databaseName || 'postgres',
        };
        const poolOptions ={
            host: postgresConnectionOptions.host,
            port: postgresConnectionOptions.port,
            user: postgresConnectionOptions.username,
            password: postgresConnectionOptions.password,
            database: postgresConnectionOptions.database,
        };
        const pool = new Pool(poolOptions);
        const conn = await pool.connect();

        const template = nodeData.inputs?.template as string
        const promptValuesStr = nodeData.inputs?.promptValues as string
   
    
        let promptFinalValues: { [key: string]: any }  = {};
        if (promptValuesStr) {
            promptFinalValues = JSON.parse(promptValuesStr);
        }
        const inputVariables = getInputVariables(template);

        let result: any;
        let queryString: string;
        let promptFinal: any;
        
        const optionsI: PromptTemplateInput = {
            template,
            inputVariables
        }
        promptFinal = new PromptTemplate(optionsI)
        promptFinalValues[chainName] = res;
        promptFinal.promptValues = promptFinalValues

        /* add results from last prompt */


        console.log(promptFinalValues);

        const pipelineName = 'Example Pipeline Name';
        const projectId = 123; // Example project_id value
        const chatflowId = 456; // Example chat_flow_id value
        const results = JSON.stringify([promptFinal.promptValues]);
        console.log(results);
        const lastUpdate = new Date(); // Example last_update value

         if (query === 'INSERT') {
            queryString = `
                INSERT INTO ${tableName}
                (${columns})
                VALUES ($1, $2, $3, $4, $5);
            `;
        } else {
            queryString = `
                SELECT * FROM ${tableName}
                WHERE pipeline_id = 1;
            `;
        }

        const params = [pipelineName, projectId, chatflowId, results, lastUpdate]; // Replace valueX with actual values
        result = await conn.query(queryString, params);
        conn.release(); 



        // eslint-disable-next-line no-console
        console.log('\x1b[93m\x1b[1m\n*****FINAL RESULT*****\n\x1b[0m\x1b[0m')
        // eslint-disable-next-line no-console
        console.log(res)
        return res
    }
}

const runPrediction = async (
    inputVariables: string[],
    chain: LLMChain,
    input: string,
    promptValuesRaw: ICommonObject,
    options: ICommonObject,
    nodeData: INodeData
) => {
    const loggerHandler = new ConsoleCallbackHandler(options.logger)
    const callbacks = await additionalCallbacks(nodeData, options)

    const isStreaming = options.socketIO && options.socketIOClientId
    const socketIO = isStreaming ? options.socketIO : undefined
    const socketIOClientId = isStreaming ? options.socketIOClientId : ''


    /**
     * Apply string transformation to reverse converted special chars:
     * FROM: { "value": "hello i am benFLOWISE_NEWLINEFLOWISE_NEWLINEFLOWISE_TABhow are you?" }
     * TO: { "value": "hello i am ben\n\n\thow are you?" }
     */
    const promptValues = handleEscapeCharacters(promptValuesRaw, true)

    if (promptValues && inputVariables.length > 0) {
        let seen: string[] = []

        for (const variable of inputVariables) {
            seen.push(variable)
            if (promptValues[variable]) {
                seen.pop()
            }
        }

        if (seen.length === 0) {
            // All inputVariables have fixed values specified
            const options = { ...promptValues }
            if (isStreaming) {
                const handler = new CustomChainHandler(socketIO, socketIOClientId)
                console.log("1");
                const res = await chain.call(options, [loggerHandler, handler, ...callbacks])
                return res?.text
            } else {
                console.log("1.1");
                const res = await chain.call(options, [loggerHandler, ...callbacks])
                return res?.text
            }
        } else if (seen.length === 1) {
            // If one inputVariable is not specify, use input (user's question) as value
            const lastValue = seen.pop()
            if (!lastValue) throw new Error('Please provide Prompt Values')
            const options = {
                ...promptValues,
                [lastValue]: input
            }
            if (isStreaming) {
                const handler = new CustomChainHandler(socketIO, socketIOClientId)
                console.log("2");
                const res = await chain.call(options, [loggerHandler, handler, ...callbacks])
                return res?.text
            } else {
                console.log("2.1");
                const res = await chain.call(options, [loggerHandler, ...callbacks])
                return res?.text
            }
        } else {
            throw new Error(`Please provide Prompt Values for: ${seen.join(', ')}`)
        }
    } else {
        if (isStreaming) {
            const handler = new CustomChainHandler(socketIO, socketIOClientId)
            console.log("3");
            const res = await chain.run(input, [loggerHandler, handler, ...callbacks])
            return res
        } else {
            console.log("3.1");
            const res = await chain.run(input, [loggerHandler, ...callbacks])
            return res
        }
    }
}

module.exports = { nodeClass: PostgressManger_Chains }
