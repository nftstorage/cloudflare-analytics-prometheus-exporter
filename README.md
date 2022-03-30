# cloudflare-analytics-prometheus-exporter

A tool to gather Cloudflare analytics from its GraphQL API and serve it in Prometheus format on `/metrics`.

## Usage

Drop a .env file in the project root and populate:

```sh
CF_API_TOKEN=<value>
CF_AUTH_EMAIL=<value>
CF_ZONE_ID=<value>
PROM_NAMESPACE="nftlinkcf"
```

Replace the following values as specified:

* `CF_API_TOKEN` with a CF API Token with access for the Zone ID you want to export metrics from.
* `CF_AUTH_EMAIL` with a CF email account with access to the provided API Token.
* `CF_ZONE_ID` with the ID of the Cloudflare Zone you want to gather metrics.

Start the exporter:

```sh
npm start
```

Metrics for reports are available at `http://localhost:3000/metrics`

### Docker

There's a `Dockerfile` that runs the tool in docker.

```sh
docker build -t checkup .
docker run -d checkup
```
