ng build --aot --prod
cd dist
zip -r -D waterpointv2.zip *
curl -X POST -u vincentminde:StrongPasswordABC123 -F file=@waterpointv2.zip https://waterpoint.tk/api/apps
