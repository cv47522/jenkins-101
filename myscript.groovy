void buildApp() {
    echo "Building the application within ${PROJECTDIR}..."
}

void testApp() {
    echo 'Testing the application...'
}

void deployApp() {
    echo "Deploying the application image ${params.IMAGE_NAME}:${params.VERSION}..."
}

return this
