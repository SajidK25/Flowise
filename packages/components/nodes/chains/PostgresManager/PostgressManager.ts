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
                label: 'Pipeline Name',
                name: 'pipelineName',
                type: 'string',
                placeholder: 'Name Your Pipeline',
                optional: true
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
        const inputVar = prompt.inputVariables as string[];
        const chain = nodeData.instance as LLMChain;
        const promptValues = prompt.promptValues as ICommonObject;
        const res = await runPrediction(inputVar, chain, input, promptValues, options, nodeData);
      
        // Database variables
        const credentialData = await getCredentialData(nodeData.credential ?? '', options);
        const user = getCredentialParam('user', credentialData, nodeData);
        const password = getCredentialParam('password', credentialData, nodeData);
        const tableName = nodeData.inputs?.tableName || 'pipeline';
        const chainName = nodeData.inputs?.chainName as string;
        const pipelineName = nodeData.inputs?.pipelineName || 'default';
      
        // Postgres connection options
        const postgresConnectionOptions = {
          type: 'postgres',
          host: nodeData.inputs?.host || 'localhost',
          port: nodeData.inputs?.port || '5432',
          username: user,
          password: password,
          database: nodeData.inputs?.databaseName || 'postgres',
        };
        const poolOptions = {
          host: postgresConnectionOptions.host,
          port: postgresConnectionOptions.port,
          user: postgresConnectionOptions.username,
          password: postgresConnectionOptions.password,
          database: postgresConnectionOptions.database,
        };
        const pool = new Pool(poolOptions);
        const conn = await pool.connect();
      
        let promptFinalValues = promptValues || {};
        let queryString: string;
      
        // Iterate through promptFinalValues and parse value if possible
        for (let key in promptFinalValues) {
          if (promptFinalValues.hasOwnProperty(key)) {
            try {
              const content = handleEscapeCharacters(promptFinalValues[key], true);
              const parseContent = JSON.parse(content);
              promptFinalValues[key] = parseContent[key];
            } catch {}
          }
        }
      
        promptFinalValues[chainName] = res;
        const projectId = 123;
        const chatflowId = 456;
        const results = JSON.stringify([promptFinalValues]);
        const lastUpdate = new Date();
        let result: any;
       
      
        const checkQuery = `
          SELECT * FROM ${tableName}
          WHERE pipeline_name = $1 AND project_id = $2 AND chat_flow_id = $3
        `;
      
        const checkParams = [pipelineName, projectId, chatflowId];
        const checkResult = await conn.query(checkQuery, checkParams);
        let params: any;
        
        if (checkResult.rows.length > 0) {
          // Record exists, perform an update
          queryString = `
            UPDATE ${tableName}
            SET results = $1, last_update = $2
            WHERE pipeline_name = $3 AND project_id = $4 AND chat_flow_id = $5;
          `;
          params = [results, lastUpdate, pipelineName, projectId, chatflowId];
                  
        } else {
          // Record doesn't exist, perform an insert
          queryString= `
            INSERT INTO ${tableName}
            (pipeline_name, project_id, chat_flow_id, results, last_update)
            VALUES ($1, $2, $3, $4, $5);
          `;
          params = [pipelineName, projectId, chatflowId, results, lastUpdate];
        }
      
        result = await conn.query(queryString, params);
        conn.release();
      
        console.log('\x1b[93m\x1b[1m\n*****FINAL RESULT*****\n\x1b[0m\x1b[0m');
        console.log(results);
        
        return results;
      }
    }      

    const checkPrompt = async (nodeData: INodeData) => {
        let template = nodeData.inputs?.template as string;
        const promptValuesStr = nodeData.inputs?.promptValues as string;
        const notConsider = nodeData.inputs?.variablesIgnored as string;
      
        const listNotConsider = notConsider ? createStringArray(notConsider) : [];
      
        template = removeWordFromString(template, listNotConsider);
      
        const promptValues = promptValuesStr ? (typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr)) : {};
      
        for (const key in promptValues) {
          if (promptValues.hasOwnProperty(key)) {
            try {
              const content = handleEscapeCharacters(promptValues[key], true);
              const parseContent = JSON.parse(content);
              promptValues[key] = parseContent[key];
            } catch {}
          }
        }
      
        const inputVariables = getInputVariables(template);
      
        const options: PromptTemplateInput = {
          template,
          inputVariables,
        };
        const prompt = new PromptTemplate(options);
        prompt.promptValues = promptValues;
        return prompt;
    };
      
function removeWordFromString(inputString : string, wordsToRemove : string[] ): string {
    const stringArray = inputString.split(" ");
    const filteredArray = stringArray.filter((word) =>
      wordsToRemove.indexOf(word) === -1
    );
    const resultString = filteredArray.join(" ");
    return resultString;
  }
  
  function createStringArray(wordList: string): string[] {
    return wordList.split(",").map((word: string) => `{${word}}`);
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