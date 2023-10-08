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
                label: 'Variable Ignored',
                name: 'variablesIgnored',
                type: 'string',
                rows: 4,
                placeholder: `Variables dont consider into the prompt`
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
        const prompt = await checkPrompt(nodeData);
        const chain = new LLMChain({ llm: model, prompt, verbose: process.env.DEBUG === 'true' ? true : false })
        return chain

    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string> {
        const prompt = await checkPrompt(nodeData);
        const inputVar = prompt.inputVariables as string[] // ["product"]
        const chain = nodeData.instance as LLMChain
        const promptValues = prompt.promptValues as ICommonObject
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

    
        let promptFinalValues: { [key: string]: any }  = {};
         
        if(promptValues){ 
            promptFinalValues = promptValues;
        }

        let result: any;
        let queryString: string;
        promptFinalValues[chainName] = res;
  
   

        const pipelineName = 'Example Pipeline Name';
        const projectId = 123; // Example project_id value
        const chatflowId = 456; // Example chat_flow_id value
        const results = JSON.stringify([promptFinalValues]);
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



const checkPrompt =async (
    nodeData: INodeData

) => {
    
    let template = nodeData.inputs?.template as string
    const promptValuesStr = nodeData.inputs?.promptValues as string
    const notConsider = nodeData.inputs?.variablesIgnored as string

    let listNotConsider : string[] = []

    if(notConsider){
        listNotConsider = createStringArray(notConsider);
    }
    template = removeWordFromString(template, listNotConsider);

    let promptValues: ICommonObject = {}
    if (promptValuesStr) {
        promptValues = JSON.parse(promptValuesStr)
    }

    const inputVariables = getInputVariables(template)

    try {
        const options: PromptTemplateInput = {
            template,
            inputVariables
        }
        const prompt = new PromptTemplate(options)
        prompt.promptValues = promptValues
        console.log(prompt);
        return prompt
    } catch (e) {
        throw new Error(e)
    }
}

function removeWordFromString(inputString : string, wordsToRemove : string[] ): string {
    const stringArray = inputString.split(" ");
    const filteredArray = stringArray.filter((word) =>
      wordsToRemove.indexOf(word) === -1
    );
    const resultString = filteredArray.join(" ");
    return resultString;
  }
  
  function createStringArray(wordList: string):  string[] {
    const wordsArray = wordList.split(",");
    const stringArray = wordsArray.map((word: string) => `{${word}}`);
    return stringArray;
  }

const runPrediction = async (
    inputVariables: string[],
    chain: LLMChain,
    input: string,
    promptValuesRaw: ICommonObject,
    options: ICommonObject,
    nodeData: INodeData
  ) => {
    const loggerHandler = new ConsoleCallbackHandler(options.logger);
    const callbacks = await additionalCallbacks(nodeData, options);
  
    const isStreaming = options.socketIO && options.socketIOClientId;
    const socketIO = isStreaming ? options.socketIO : undefined;
    const socketIOClientId = isStreaming ? options.socketIOClientId : '';
  
    const promptValues = handleEscapeCharacters(promptValuesRaw, true);
  
    const handler = new CustomChainHandler(socketIO, socketIOClientId);
    const mergedOptions = { ...promptValues, ...(inputVariables.length === 1 && { [inputVariables[0]]: input }) };
  
    let res;
  
    if (isStreaming) {
      console.log('1');
      res = await chain.call(mergedOptions, [loggerHandler, handler, ...callbacks]);
    } else {
      console.log('1.1');
      res = await chain.call(mergedOptions, [loggerHandler, ...callbacks]);
    }
  
    return res?.text || res;
  };


  module.exports = { nodeClass: PostgressManger_Chains }