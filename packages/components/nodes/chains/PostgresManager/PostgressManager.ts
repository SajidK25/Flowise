import { INode, INodeParams,  PromptTemplate } from '../../../src/Interface'
import { getBaseClasses,getInputVariables, getCredentialData, getCredentialParam } from '../../../src/utils'
import { LLMChain } from 'langchain/chains'
import { PromptTemplateInput } from 'langchain/prompts'
import { Pool } from 'pg'


class PostgresManager_Chains implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    host: string
    databaseName: string
    port: string
    tableName : string
    category: string
    baseClasses: string[]
    description: string
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Postgres Set New Data';
        this.name = 'postgresNewData';
        this.version = 1.0;
        this.icon = 'chain.svg';
        this.category = 'Chains';
        this.description = 'Manage data base';
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

        ];

    }
   async init(nodeData: any, input: any, options: any): Promise<string> {

        console.log('\x1b[93m\x1b[1m\n*****INITIATING SAVING*****\n\x1b[0m\x1b[0m');
        return"START SAVING";
    
    }
    async run(nodeData: any, input: any, options: any): Promise<string> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const user = getCredentialParam('user', credentialData, nodeData)
        const password = getCredentialParam('password', credentialData, nodeData)
        const tableName = nodeData.inputs?.tableName || 'pipeline' as string
        const columns = nodeData.inputs?.columns || 'pipeline_name, project_id, chat_flow_id, results, last_update' as string
        const query = nodeData.inputs?.queryToSend as string
    
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
   
    
        let promptValues = {};
        if (promptValuesStr) {
            promptValues = JSON.parse(promptValuesStr);
        }
        const inputVariables = getInputVariables(template);
    
        let result: any;
        let queryString: string;
        let prompt: any;
    
        
        const optionsI: PromptTemplateInput = {
            template,
            inputVariables
        }
        prompt = new PromptTemplate(optionsI)
        prompt.promptValues = promptValues

        const pipelineName = 'Example Pipeline Name';
        const projectId = 123; // Example project_id value
        const chatflowId = 456; // Example chat_flow_id value
        const results = JSON.stringify([prompt.promptValues]);
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
        console.log('\x1b[93m\x1b[1m\n*****FINAL RESULT*****\n\x1b[0m\x1b[0m');
        return results;
    
    }
    

  }

module.exports = { nodeClass: PostgresManager_Chains }
