import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";

export interface MonitoringStackProps extends cdk.StackProps {
  lambdaFunctionName: string;
  apiGatewayName: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const alertTopic = new sns.Topic(this, "AlertTopic", {
      topicName: "BoardingHouseAlerts",
      displayName: "Smart Boarding House Alerts",
    });

    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription("admin@smartboardinghouse.com")
    );

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, "LambdaErrorAlarm", {
      alarmName: "BoardingHouse-Lambda-Errors",
      alarmDescription: "Lambda function error rate is too high",
      metric: new cloudwatch.Metric({
        namespace: "AWS/Lambda",
        metricName: "Errors",
        dimensionsMap: {
          FunctionName: props.lambdaFunctionName,
        },
        statistic: "Sum",
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      "LambdaDurationAlarm",
      {
        alarmName: "BoardingHouse-Lambda-Duration",
        alarmDescription: "Lambda function duration is too high",
        metric: new cloudwatch.Metric({
          namespace: "AWS/Lambda",
          metricName: "Duration",
          dimensionsMap: {
            FunctionName: props.lambdaFunctionName,
          },
          statistic: "Average",
        }),
        threshold: 25000,
        evaluationPeriods: 3,
      }
    );

    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    const apiGateway4xxAlarm = new cloudwatch.Alarm(
      this,
      "ApiGateway4xxAlarm",
      {
        alarmName: "BoardingHouse-API-4xx-Errors",
        alarmDescription: "API Gateway 4xx error rate is too high",
        metric: new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "4XXError",
          dimensionsMap: {
            ApiName: props.apiGatewayName,
          },
          statistic: "Sum",
        }),
        threshold: 10,
        evaluationPeriods: 2,
      }
    );

    apiGateway4xxAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    const apiGateway5xxAlarm = new cloudwatch.Alarm(
      this,
      "ApiGateway5xxAlarm",
      {
        alarmName: "BoardingHouse-API-5xx-Errors",
        alarmDescription: "API Gateway 5xx error rate is too high",
        metric: new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "5XXError",
          dimensionsMap: {
            ApiName: props.apiGatewayName,
          },
          statistic: "Sum",
        }),
        threshold: 3,
        evaluationPeriods: 1,
      }
    );

    apiGateway5xxAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    const dashboard = new cloudwatch.Dashboard(this, "BoardingHouseDashboard", {
      dashboardName: "SmartBoardingHouse-Monitoring",
      defaultInterval: cdk.Duration.hours(24),
      periodOverride: cloudwatch.PeriodOverride.AUTO,
    });

    // Row 1: Lambda Overview
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Invocations",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Invocations",
            dimensionsMap: {
              FunctionName: props.lambdaFunctionName,
            },
            statistic: "Sum",
            label: "Total Invocations",
          }),
        ],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Errors",
            dimensionsMap: {
              FunctionName: props.lambdaFunctionName,
            },
            statistic: "Sum",
            label: "Errors",
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Throttles",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Throttles",
            dimensionsMap: {
              FunctionName: props.lambdaFunctionName,
            },
            statistic: "Sum",
            label: "Throttles",
            color: cloudwatch.Color.ORANGE,
          }),
        ],
        width: 8,
        height: 6,
      })
    );

    // Row 2: Lambda Performance
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Duration (ms)",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Duration",
            dimensionsMap: {
              FunctionName: props.lambdaFunctionName,
            },
            statistic: "Average",
            label: "Avg Duration",
            color: cloudwatch.Color.BLUE,
          }),
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Duration",
            dimensionsMap: {
              FunctionName: props.lambdaFunctionName,
            },
            statistic: "Maximum",
            label: "Max Duration",
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Concurrent Executions",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "ConcurrentExecutions",
            dimensionsMap: {
              FunctionName: props.lambdaFunctionName,
            },
            statistic: "Maximum",
            label: "Concurrent Executions",
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Row 3: API Gateway Overview
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "API Gateway Requests",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "Count",
            dimensionsMap: {
              ApiName: props.apiGatewayName,
            },
            statistic: "Sum",
            label: "Total Requests",
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "API Gateway Latency (ms)",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "Latency",
            dimensionsMap: {
              ApiName: props.apiGatewayName,
            },
            statistic: "Average",
            label: "Avg Latency",
            color: cloudwatch.Color.BLUE,
          }),
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "Latency",
            dimensionsMap: {
              ApiName: props.apiGatewayName,
            },
            statistic: "p99",
            label: "P99 Latency",
            color: cloudwatch.Color.ORANGE,
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Row 4: API Gateway Errors
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "API Gateway 4XX Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "4XXError",
            dimensionsMap: {
              ApiName: props.apiGatewayName,
            },
            statistic: "Sum",
            label: "Client Errors (4XX)",
            color: cloudwatch.Color.ORANGE,
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "API Gateway 5XX Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "5XXError",
            dimensionsMap: {
              ApiName: props.apiGatewayName,
            },
            statistic: "Sum",
            label: "Server Errors (5XX)",
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Row 5: DynamoDB Metrics (BoardingHouseListings table)
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "DynamoDB - Listings Table Read/Write",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/DynamoDB",
            metricName: "ConsumedReadCapacityUnits",
            dimensionsMap: {
              TableName: "BoardingHouseListings",
            },
            statistic: "Sum",
            label: "Read Capacity",
            color: cloudwatch.Color.BLUE,
          }),
          new cloudwatch.Metric({
            namespace: "AWS/DynamoDB",
            metricName: "ConsumedWriteCapacityUnits",
            dimensionsMap: {
              TableName: "BoardingHouseListings",
            },
            statistic: "Sum",
            label: "Write Capacity",
            color: cloudwatch.Color.GREEN,
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "DynamoDB - User Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/DynamoDB",
            metricName: "UserErrors",
            dimensionsMap: {
              TableName: "BoardingHouseListings",
            },
            statistic: "Sum",
            label: "Listings Table Errors",
            color: cloudwatch.Color.RED,
          }),
          new cloudwatch.Metric({
            namespace: "AWS/DynamoDB",
            metricName: "UserErrors",
            dimensionsMap: {
              TableName: "UserFavorites",
            },
            statistic: "Sum",
            label: "Favorites Table Errors",
            color: cloudwatch.Color.ORANGE,
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Row 6: System Health Summary
    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: "Lambda Error Rate (%)",
        metrics: [
          new cloudwatch.MathExpression({
            expression: "(errors / invocations) * 100",
            usingMetrics: {
              errors: new cloudwatch.Metric({
                namespace: "AWS/Lambda",
                metricName: "Errors",
                dimensionsMap: {
                  FunctionName: props.lambdaFunctionName,
                },
                statistic: "Sum",
              }),
              invocations: new cloudwatch.Metric({
                namespace: "AWS/Lambda",
                metricName: "Invocations",
                dimensionsMap: {
                  FunctionName: props.lambdaFunctionName,
                },
                statistic: "Sum",
              }),
            },
            label: "Error Rate",
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "API Gateway Error Rate (%)",
        metrics: [
          new cloudwatch.MathExpression({
            expression: "((e4xx + e5xx) / requests) * 100",
            usingMetrics: {
              e4xx: new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "4XXError",
                dimensionsMap: {
                  ApiName: props.apiGatewayName,
                },
                statistic: "Sum",
              }),
              e5xx: new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "5XXError",
                dimensionsMap: {
                  ApiName: props.apiGatewayName,
                },
                statistic: "Sum",
              }),
              requests: new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "Count",
                dimensionsMap: {
                  ApiName: props.apiGatewayName,
                },
                statistic: "Sum",
              }),
            },
            label: "Error Rate",
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Avg Response Time (ms)",
        metrics: [
          new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: "Duration",
            dimensionsMap: {
              FunctionName: props.lambdaFunctionName,
            },
            statistic: "Average",
            label: "Avg Duration",
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Total Requests (24h)",
        metrics: [
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "Count",
            dimensionsMap: {
              ApiName: props.apiGatewayName,
            },
            statistic: "Sum",
            label: "Requests",
          }),
        ],
        width: 6,
        height: 6,
      })
    );
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Bedrock - Token Usage",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "InputTokens",
            statistic: "Sum",
            label: "Input Tokens",
            color: cloudwatch.Color.BLUE,
          }),
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "OutputTokens",
            statistic: "Sum",
            label: "Output Tokens",
            color: cloudwatch.Color.GREEN,
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: "Bedrock - Invocations & Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "Invocations",
            statistic: "Sum",
            label: "Total Invocations",
            color: cloudwatch.Color.BLUE,
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "InvocationClientErrors",
            statistic: "Sum",
            label: "Client Errors",
            color: cloudwatch.Color.ORANGE,
          }),
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "InvocationServerErrors",
            statistic: "Sum",
            label: "Server Errors",
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Row 8: Bedrock Model-Specific Metrics (Summary)
    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: "Total Bedrock Input Tokens (24h)",
        metrics: [
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "InputTokens",
            statistic: "Sum",
            label: "Input Tokens",
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Total Bedrock Output Tokens (24h)",
        metrics: [
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "OutputTokens",
            statistic: "Sum",
            label: "Output Tokens",
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Bedrock Invocations (24h)",
        metrics: [
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "Invocations",
            statistic: "Sum",
            label: "Invocations",
          }),
        ],
        width: 6,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: "Bedrock Invocation Latency (ms)",
        metrics: [
          new cloudwatch.Metric({
            namespace: "AWS/Bedrock",
            metricName: "InvocationLatency",
            statistic: "Average",
            label: "Avg Latency",
          }),
        ],
        width: 6,
        height: 6,
      })
    );

    new cdk.CfnOutput(this, "AlertTopicArn", {
      value: alertTopic.topicArn,
      description: "SNS Topic ARN for alerts",
    });

    new cdk.CfnOutput(this, "DashboardUrl", {
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#dashboards:name=${dashboard.dashboardName}`,
      description: "CloudWatch Dashboard URL",
    });
  }
}
