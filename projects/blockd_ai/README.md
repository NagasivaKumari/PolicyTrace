# BLOCKD: AI Compliance Module

DPDP Act 2023 compliance classification using NLP.

## 🤖 Core Logic

- **Model**: DistilBERT-based zero-shot classification.
- **Scoring**: Custom algorithm based on DPDP Act section weights and identified violations.
- **Categories**: Consent, Data Minimisation, Fiduciary Obligations, Children's Data.

## 📊 Usage

- **Scanner**: Orchestrates the classification of policy text chunks.
- **Rules**: Definition of compliance violation patterns and risk weights.

## 🛠 Setup

```bash
pip install -r requirements.txt
```
The module expects `torch` and `transformers` for inference.
