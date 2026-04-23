# Jenkins Docker Deployment

## 1. Start Jenkins

Run Jenkins with the Docker CLI available inside the container and access to the host Docker daemon:

```bash
docker compose -f docker-compose.jenkins.yml up -d --build
```

## 2. Verify the Jenkins container

Check that both Git and Docker are available:

```bash
docker exec -it jenkins bash -lc "git --version && docker version"
```

If `docker version` reports a permissions error, keep the container running as `root` or adjust socket permissions on the host.

## 3. Recommended Jenkins job settings

- Job type: `Pipeline`
- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `https://github.com/yangm6569-code/pipeline-test.git`
- Credentials: your GitHub token credential
- Branch Specifier: `*/master`
- Script Path: `Jenkinsfile`
- Disable `Lightweight checkout`

## 4. Required Jenkins credentials

- `github-token`: GitHub Personal Access Token for repository checkout
- `dockerhub-credentials`: Docker Hub username + access token

## 5. Webhook

If you want GitHub push events to trigger builds, point the GitHub webhook to:

```text
http(s)://<your-jenkins-host>/github-webhook/
```

If Jenkins is only running locally and GitHub cannot reach it, use manual builds or SCM polling until a public endpoint is available.
