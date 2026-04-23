pipeline {
    agent any

    triggers {
        githubPush()   // GitHub push 事件自动触发构建
    }

    environment {
        DOCKER_IMAGE = 'yangm6569/gaoxiaokeyan-front'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
    }

    stages {
        // 不再需要显式的 Checkout 阶段！Jenkins 自动拉取代码

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