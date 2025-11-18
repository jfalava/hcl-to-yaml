# Grafana Example: System Monitoring Dashboard
use grafana

dashboard {
  uid = "system-monitoring"
  title = "System Monitoring Dashboard"
  description = "Monitor CPU, Memory, and Network metrics"
  tags = ["system", "infrastructure"]
  timezone = "UTC"
  editable = true
  refresh = "30s"

  time {
    from = "now-6h"
    to = "now"
  }

  panels {
    cpu_usage {
      id = 1
      type = "timeseries"
      title = "CPU Usage %"
      gridPos {
        x = 0
        y = 0
        w = 12
        h = 8
      }
      targets = [
        {
          refId = "A"
          expr = "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
          legendFormat = "{{instance}}"
        }
      ]
      fieldConfig {
        defaults {
          unit = "percent"
          min = 0
          max = 100
        }
      }
    }

    memory_usage {
      id = 2
      type = "gauge"
      title = "Memory Usage"
      gridPos {
        x = 12
        y = 0
        w = 12
        h = 8
      }
      targets = [
        {
          refId = "A"
          expr = "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100"
        }
      ]
      fieldConfig {
        defaults {
          unit = "percent"
          min = 0
          max = 100
          thresholds {
            mode = "absolute"
            steps = [
              {value = 0, color = "green"},
              {value = 80, color = "yellow"},
              {value = 95, color = "red"}
            ]
          }
        }
      }
    }

    network_traffic {
      id = 3
      type = "timeseries"
      title = "Network Traffic"
      gridPos {
        x = 0
        y = 8
        w = 24
        h = 8
      }
      targets = [
        {
          refId = "A"
          expr = "rate(node_network_receive_bytes_total[5m])"
          legendFormat = "{{device}} - RX"
        },
        {
          refId = "B"
          expr = "rate(node_network_transmit_bytes_total[5m])"
          legendFormat = "{{device}} - TX"
        }
      ]
      fieldConfig {
        defaults {
          unit = "Bps"
        }
      }
    }
  }

  templating {
    list = [
      {
        name = "instance"
        type = "query"
        datasource = "Prometheus"
        query = "label_values(node_cpu_seconds_total, instance)"
        multi = true
        includeAll = true
        refresh = 1
      }
    ]
  }
}
