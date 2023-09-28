#!/bin/sh

echo DEBUG=0 >> .env
#echo SQL_ENGINE=django.db.backends.postgresql >> .env
echo SQL_ENGINE=$SQL_ENGINE >> .env
echo DATABASE=postgres >> .env

echo SECRET_KEY=$SECRET_KEY >> .env
echo SQL_DATABASE=$SQL_DATABASE >> .env
echo SQL_USER=$SQL_USER >> .env
echo SQL_PASSWORD=$SQL_PASSWORD >> .env
echo SQL_HOST=$SQL_HOST >> .env
echo SQL_PORT=$SQL_PORT >> .env
echo WEB_IMAGE=$IMAGE:web  >> .env
echo NGINX_IMAGE=$IMAGE:nginx  >> .env
echo CI_REGISTRY_USER=$CI_REGISTRY_USER   >> .env
echo CI_JOB_TOKEN=$CI_JOB_TOKEN  >> .env
echo CI_REGISTRY=$CI_REGISTRY  >> .env
echo IMAGE=$CI_REGISTRY/$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME >> .env


echo PORT=3000 >> ./packages/server/.env
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

echo PORT=8080 >> ./packages/ui/.env
