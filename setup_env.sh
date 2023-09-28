#!/bin/sh

echo PORT=3000 > ./packages/server/.env
echo PASSPHRASE=MYPASSPHRASE >> ./packages/server/.env # Passphrase used to create encryption key
#echo DATABASE_PATH=/your_database_path/.flowise >> ./packages/server/.env
#echo APIKEY_PATH=/your_api_key_path/.flowise >> ./packages/server/.env
#echo SECRETKEY_PATH=/your_api_key_path/.flowise >> ./packages/server/.env
#echo LOG_PATH=/your_log_path/.flowise/logs >> ./packages/server/.env

#echo NUMBER_OF_PROXIES= 1 >> ./packages/server/.env

#echo DATABASE_TYPE=postgres >> ./packages/server/.env
#echo DATABASE_PORT="" >> ./packages/server/.env
#echo DATABASE_HOST="" >> ./packages/server/.env
#echo DATABASE_NAME="flowise" >> ./packages/server/.env
#echo DATABASE_USER="" >> ./packages/server/.env
#echo DATABASE_PASSWORD="" >> ./packages/server/.env
#echo OVERRIDE_DATABASE=true >> ./packages/server/.env

#echo FLOWISE_USERNAME=user >> ./packages/server/.env
#echo FLOWISE_PASSWORD=1234 >> ./packages/server/.env
#echo DEBUG=true >> ./packages/server/.env
#echo LOG_LEVEL=debug (error | warn | info | verbose | debug) >> ./packages/server/.env
#echo TOOL_FUNCTION_BUILTIN_DEP=crypto,fs >> ./packages/server/.env
#echo TOOL_FUNCTION_EXTERNAL_DEP=moment,lodash >> ./packages/server/.env

#echo LANGCHAIN_TRACING_V2=true >> ./packages/server/.env
#echo LANGCHAIN_ENDPOINT=https://api.smith.langchain.com >> ./packages/server/.env
#echo LANGCHAIN_API_KEY=your_api_key >> ./packages/server/.env
#echo LANGCHAIN_PROJECT=your_project >> ./packages/server/.env

echo PORT=8088 > ./packages/ui/.env
