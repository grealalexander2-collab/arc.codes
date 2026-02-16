---
title: AWS purchasing options
category: Developer experience
description: Understanding AWS purchasing options for cost optimization
---

Architect applications run on AWS Lambda and other AWS services. Understanding AWS purchasing options can help you optimize costs for your serverless applications, especially at scale.

## Lambda pricing models

AWS Lambda offers flexible pricing options to suit different usage patterns and budgets.

### On-demand pricing

By default, Lambda uses on-demand pricing with no upfront costs or long-term commitments.

- **Pay per use**: Charged based on the number of requests and compute duration
- **No commitment**: Billed only for what you consume
- **Best for**: Applications with variable or unpredictable workloads

Lambda on-demand pricing includes:
- **Requests**: First 1 million requests per month are free, then $0.20 per 1 million requests
- **Duration**: Charged based on allocated memory and execution time (GB-seconds)
- **Free tier**: 400,000 GB-seconds of compute time per month

> Learn more about [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/)

### Compute Savings Plans

For applications with predictable, steady-state usage, AWS offers **Compute Savings Plans** to reduce costs.

**How Compute Savings Plans work:**
- Commit to a consistent amount of compute usage (measured in $/hour) for 1 or 3 years
- Receive up to **66% discount** compared to on-demand pricing
- Plans automatically apply to Lambda, Fargate, and EC2 usage across all regions
- Usage above your commitment is charged at standard on-demand rates

**Benefits:**
- **Flexible**: Applies to any Lambda function in your account, regardless of runtime, region, or memory configuration
- **Automatic application**: No need to specify which functions benefit from the plan
- **Significant savings**: Best for high-volume or production workloads

**Example scenario:**
If your Lambda usage consistently costs $100/month on-demand, you could commit to a Compute Savings Plan of ~$1.50/hour (approximately $1,080/year for a 1-year plan) and save up to 66% compared to on-demand pricing over that year.

> Learn more about [AWS Compute Savings Plans](https://aws.amazon.com/savingsplans/compute-pricing/)

## Determining the right pricing model

Choose your pricing strategy based on your application's usage patterns:

| Usage Pattern | Recommended Pricing | Why |
|--------------|---------------------|-----|
| Development and testing | On-demand | No predictable usage, benefit from free tier |
| Intermittent or variable production | On-demand | No commitment needed, pay only for actual usage |
| Steady, predictable production | Compute Savings Plans | Significant cost savings for consistent workloads |
| High-volume production | Compute Savings Plans (3-year) | Maximum savings (up to 66% discount) |

## Cost optimization tools

AWS provides several tools to help you analyze and optimize your Lambda costs:

### AWS Cost Explorer

Use [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/) to:
- Visualize Lambda spending over time
- Identify cost trends and anomalies
- Receive recommendations for Savings Plans based on your usage history

### Recommendations process

1. Navigate to AWS Cost Explorer in the AWS Console
2. Select "Savings Plans" from the left navigation
3. Review recommendations based on your Lambda usage patterns
4. Choose a commitment level that matches your baseline usage
5. Purchase a Savings Plan directly from the console

> **Tip**: Start with a conservative commitment covering 50-70% of your baseline usage to ensure you don't over-commit

## Architecture considerations for cost optimization

Beyond purchasing options, consider these strategies to optimize Lambda costs:

- **Right-size memory allocation**: Lambda bills by GB-seconds, so allocate only the memory your functions need
- **Reduce cold starts**: Use provisioned concurrency for latency-sensitive applications (note: provisioned concurrency has different pricing)
- **Optimize execution time**: Faster functions cost less; optimize code and reduce external dependencies
- **Use appropriate architecture**: Consider Lambda's free tier when designing microservices

## Reserved capacity vs. Savings Plans

**Important**: AWS Lambda does **not** support Reserved Instances (RIs). Reserved Instances are only available for Amazon EC2.

- **Reserved Instances**: Only for EC2, require committing to a specific instance type, region, and operating system
- **Compute Savings Plans**: More flexible, apply to Lambda, Fargate, and EC2 across all regions and configurations

For Lambda workloads, **Compute Savings Plans** are the only commitment-based discount option available.

## Getting started with Savings Plans

1. Monitor your Architect application's Lambda usage for 30-60 days in production
2. Use AWS Cost Explorer to identify baseline usage patterns
3. Review Savings Plan recommendations
4. Start with a conservative commitment (e.g., 50% of baseline usage)
5. Expand commitments as usage patterns stabilize

> **Note**: Savings Plans are account-level commitments and apply to all eligible Lambda usage, not just Architect applications

## Additional resources

- [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/)
- [AWS Compute Savings Plans](https://aws.amazon.com/savingsplans/compute-pricing/)
- [Savings Plans FAQ](https://aws.amazon.com/savingsplans/faqs/)
- [AWS Cost Management documentation](https://docs.aws.amazon.com/cost-management/)
