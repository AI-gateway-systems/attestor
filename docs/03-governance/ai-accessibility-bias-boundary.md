# AI Accessibility And Bias Boundary

Status: AI governance boundary for fairness, accessibility, and upstream model
risk.

Attestor does not train or certify upstream AI models. It evaluates consequences
and evidence around actions that upstream systems propose. That distinction
matters: Attestor can surface risk evidence and force review, but it cannot
prove that the upstream model, dataset, or user interface is unbiased,
accessible, or lawful.

Official anchors:

- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html)
- [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)
- [EU AI Act Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)

## What Attestor Can Support

- classify high-risk consequences
- require evidence before an action proceeds
- route uncertain or high-impact decisions to review
- preserve review packets and proof refs
- block action classes without sufficient authority or scope
- record when bias-relevant or accessibility-relevant evidence is missing

## What Remains Customer-Owned

- upstream model selection and evaluation
- dataset quality and representativeness
- bias testing and accessibility testing
- user notice and appeal process
- domain-specific legal review
- UI accessibility review under the customer's product surface

## Safe Claim

> Attestor can make AI consequence decisions more reviewable and evidence-bound.

## Unsafe Claim

> Attestor proves an upstream AI system is fair, unbiased, accessible, or
> compliant.
