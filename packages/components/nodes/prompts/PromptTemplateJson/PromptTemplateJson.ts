import { ICommonObject, INode, INodeData, INodeParams, PromptTemplate } from '../../../src/Interface'
import { getBaseClasses, getInputVariables, handleEscapeCharacters } from '../../../src/utils'
import { PromptTemplateInput } from 'langchain/prompts'


class PromptTemplate_Prompts implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Prompt Template Json'
        this.name = 'promptTemplateJson'
        this.version = 1.0
        this.type = 'PromptTemplate'
        this.icon = 'prompt.svg'
        this.category = 'Prompts'
        this.description = 'Schema to represent a basic prompt for an LLM'
        this.baseClasses = [...getBaseClasses(PromptTemplate)]
        this.inputs = [
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
                label: 'Info to add from the question format json',
                name: 'listAttributes',
                type: 'string',
                rows: 4,
                placeholder: `item1,item2`
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const template = nodeData.inputs?.template as string
        const promptValuesStr = nodeData.inputs?.promptValues as string
        const listAttributes = nodeData.inputs?.listAttributes as string




        let promptValues: ICommonObject = {}
        if (promptValuesStr) {
            try {
                promptValues = typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr)


                if(listAttributes){
                    const filterAttributes= createStringArray(listAttributes);
                    filterAttributes.forEach((att) => {

                        if (promptValues.hasOwnProperty(att)) {
                          const content =  handleEscapeCharacters(promptValues[att], true);
                          const parseContent = JSON.parse(content);
                          promptValues[att] = parseContent[att];

                        }
                      });
                }
                
            } catch (exception) {
                throw new Error("Invalid JSON in the PromptTemplate's promptValues: " + exception)
            }
        }
 

        const inputVariables = getInputVariables(template)

        try {
            const options: PromptTemplateInput = {
                template,
                inputVariables
            }
            const prompt = new PromptTemplate(options)
            prompt.promptValues = promptValues
            return prompt
        } catch (e) {
            throw new Error(e)
        }
    }
}

function createStringArray(wordList: string):  string[] {
    const wordsArray = wordList.split(",");
    const stringArray = wordsArray.map((word: string) => `${word}`);
    return stringArray;
  }

module.exports = { nodeClass: PromptTemplate_Prompts }
