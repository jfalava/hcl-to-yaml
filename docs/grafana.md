# Grafana Dashboard HCL Guide

Write Grafana dashboards using HCL syntax and convert them to YAML/JSON.

## Quick Start

Add `use grafana` directive at the top of your HCL file:

```hcl
use grafana

dashboard {
  title = "My Dashboard"
  # Dashboard configuration
}
```

## Basic Dashboard Structure

```hcl
use grafana

dashboard {
  title = "System Metrics"
  tags = ["system", "monitoring"]
  timezone = "UTC"
  refresh = "30s"
  editable = true

  panels {
    # Panel configurations
  }
}
```

## Complete Example: System Monitoring Dashboard

```hcl
use grafana

dashboard {
  uid = "system-metrics"
  title = "System Metrics Dashboard"
  description = "Monitor system CPU, memory, and disk usage"
  tags = ["system", "infrastructure", "monitoring"]
  timezone = "browser"
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
      title = "CPU Usage"
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
      type = "timeseries"
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

    disk_usage {
      id = 3
      type = "gauge"
      title = "Disk Usage"
      gridPos {
        x = 0
        y = 8
        w = 8
        h = 6
      }
      targets = [
        {
          refId = "A"
          expr = "(node_filesystem_size_bytes{mountpoint=\"/\"} - node_filesystem_avail_bytes{mountpoint=\"/\"}) / node_filesystem_size_bytes{mountpoint=\"/\"} * 100"
        }
      ]
      options {
        showThresholdLabels = false
        showThresholdMarkers = true
      }
      fieldConfig {
        defaults {
          unit = "percent"
          min = 0
          max = 100
          thresholds {
            mode = "absolute"
            steps = [
              {value = 0, color = "green"},
              {value = 70, color = "yellow"},
              {value = 90, color = "red"}
            ]
          }
        }
      }
    }

    network_traffic {
      id = 4
      type = "timeseries"
      title = "Network Traffic"
      gridPos {
        x = 8
        y = 8
        w = 16
        h = 6
      }
      targets = [
        {
          refId = "A"
          expr = "rate(node_network_receive_bytes_total[5m])"
          legendFormat = "{{device}} - Receive"
        },
        {
          refId = "B"
          expr = "rate(node_network_transmit_bytes_total[5m])"
          legendFormat = "{{device}} - Transmit"
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

  annotations {
    list = [
      {
        name = "Deployments"
        datasource = "Prometheus"
        enable = true
        expr = "changes(deployment_info[5m]) > 0"
        iconColor = "blue"
        tags = ["deployment"]
      }
    ]
  }
}
```

## Panel Types

### Timeseries (Graph)

```hcl
panels {
  my_graph {
    type = "timeseries"
    title = "Request Rate"
    targets = [
      {
        expr = "rate(http_requests_total[5m])"
        legendFormat = "{{method}} {{status}}"
      }
    ]
  }
}
```

### Gauge

```hcl
panels {
  my_gauge {
    type = "gauge"
    title = "Current CPU"
    targets = [
      {
        expr = "avg(cpu_usage)"
      }
    ]
    options {
      showThresholdMarkers = true
    }
  }
}
```

### Stat (Single Stat)

```hcl
panels {
  my_stat {
    type = "stat"
    title = "Total Users"
    targets = [
      {
        expr = "count(user_active)"
      }
    ]
    options {
      graphMode = "none"
      colorMode = "background"
    }
  }
}
```

### Table

```hcl
panels {
  my_table {
    type = "table"
    title = "Service Status"
    targets = [
      {
        expr = "up{job=\"api\"}"
        format = "table"
      }
    ]
  }
}
```

## Templating (Variables)

```hcl
templating {
  list = [
    {
      name = "environment"
      type = "custom"
      query = "production,staging,development"
      multi = false
      includeAll = false
      current {
        text = "production"
        value = "production"
      }
    },
    {
      name = "namespace"
      type = "query"
      datasource = "Prometheus"
      query = "label_values(kube_pod_info, namespace)"
      multi = true
      includeAll = true
      refresh = 1
    }
  ]
}
```

## Best Practices

1. **Use meaningful panel IDs**: Make IDs descriptive and sequential
2. **Grid positioning**: Plan your layout with gridPos (x, y, w, h)
3. **Consistent refresh rates**: Use appropriate refresh intervals (30s, 1m, 5m)
4. **Template variables**: Parameterize dashboards for reusability
5. **Proper units**: Always specify units (percent, bytes, seconds, etc.)
6. **Thresholds**: Set meaningful thresholds for alerts and color coding

## Conversion

```bash
hcl2yaml dashboard.hcl dashboard.yaml
```

The tool detects `use grafana` and applies Grafana-specific validation.

## Common Panel Types

- `timeseries` - Time series graph
- `gauge` - Gauge visualization
- `stat` - Single stat
- `table` - Table panel
- `heatmap` - Heatmap
- `bargauge` - Bar gauge
- `piechart` - Pie chart
- `logs` - Log panel
- `text` - Text/markdown panel

## Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Dashboard JSON Model](https://grafana.com/docs/grafana/latest/dashboards/json-model/)
- [Panel Plugins](https://grafana.com/grafana/plugins/?type=panel)
