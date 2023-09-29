#!/bin/sh

echo PORT=3001 > ./packages/server/.env
echo PASSPHRASE=MYPASSPHRASE >> ./packages/server/.env # Passphrase used to create encryption key
# echo DATABASE_PATH=/root/.flowise >> ./packages/server/.env
# echo APIKEY_PATH=/root/.flowise >> ./packages/server/.env
# echo SECRETKEY_PATH=/root/.flowise >> ./packages/server/.env
# echo LOG_PATH=/root/.flowise/logs >> ./packages/server/.env

echo NUMBER_OF_PROXIES= 1 >> ./packages/server/.env

echo DATABASE_TYPE=postgres >> ./packages/server/.env
echo DATABASE_PORT=5432 >> ./packages/server/.env
echo DATABASE_HOST=localhost >> ./packages/server/.env
echo DATABASE_NAME=flowise >> ./packages/server/.env
echo DATABASE_USER=flowise >> ./packages/server/.env
echo DATABASE_PASSWORD=Change_this_password >> ./packages/server/.env
echo OVERRIDE_DATABASE=true >> ./packages/server/.env

echo FLOWISE_USERNAME=falktr0n >> ./packages/server/.env
echo FLOWISE_PASSWORD=Change_this_password >> ./packages/server/.env
echo DEBUG=true >> ./packages/server/.env
echo LOG_LEVEL="debug (error | warn | info | verbose | debug)" >> ./packages/server/.env
#echo TOOL_FUNCTION_BUILTIN_DEP=crypto,fs >> ./packages/server/.env
#echo TOOL_FUNCTION_EXTERNAL_DEP=moment,lodash >> ./packages/server/.env

#echo LANGCHAIN_TRACING_V2=true >> ./packages/server/.env
#echo LANGCHAIN_ENDPOINT=https://api.smith.langchain.com >> ./packages/server/.env
#echo LANGCHAIN_API_KEY=your_api_key >> ./packages/server/.env
#echo LANGCHAIN_PROJECT=your_project >> ./packages/server/.env

echo PORT=8088 > ./packages/ui/.env
