@app
arc-codes

@aws
region us-west-2
profile openjsf

@static
fingerprint true

@http
get /
get /docs/:lang/*
get /api/package
get /arc-data
get /arc-viewer
any /*
