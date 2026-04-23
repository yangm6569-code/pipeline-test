pipeline {
    agent any

    triggers {
        githubPush()   // GitHub push 事件自动触发构建
    }

    environment {
        DOCKER_IMAGE = 'yangming93432/gaoxiaokeyan-front'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
    }

    stages {
        stage('Verify Docker Environment') {
            steps {
                sh '''
                    set -eu
                    echo "Workspace: $(pwd)"

                    if ! command -v docker >/dev/null 2>&1; then
                        echo "ERROR: docker CLI not found in the Jenkins agent."
                        echo "Install Docker CLI in the Jenkins container and mount /var/run/docker.sock."
                        exit 1
                    fi

                    docker version
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def imageTag = "${DOCKER_IMAGE}:${env.BUILD_NUMBER}"
                    sh "docker build -t ${imageTag} ."
                    sh "docker tag ${imageTag} ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    withDockerRegistry([credentialsId: DOCKER_CREDENTIALS_ID, url: '']) {
                        sh "docker push ${DOCKER_IMAGE}:${env.BUILD_NUMBER}"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }
    }

    post {
        success {
            echo '镜像构建并推送成功!'
        }
        failure {
            echo '构建失败!'
        }
    }
}
