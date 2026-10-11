# AI Use Declaration

## Tools used
- Kiro, Claude, Gemini

## Where they were used
- **Frontend:** Built most of the React + TypeScript UI in `src/client/` (dashboard, prediction form and panel, analytics page, live flights page, filter panel, data tables, header, auth modal and shared styling) and wired it to the FastAPI endpoints.
- **Cloud architecture:** Guided the AWS design: VPC with 2 public and 2 private subnets, EC2 Auto Scaling Group behind an Application Load Balancer, launch templates, RDS Multi-AZ, security groups and Docker deployment with environment-variable configuration.
- **Machine learning:** Guided preprocessing, feature selection, XGBoost tuning, choice of evaluation metrics and exporting the model and preprocessor for the backend.
- **Database:** Guided relational schema design, summary tables and SQL queries for flight search, historical analytics and saved flights.
- **Backend:** Helped with FastAPI endpoints, JWT authentication, CRUD operations, the Aviationstack integration and serving the ML model.
- **Troubleshooting:** Helped diagnose build and type errors, merge conflicts, Docker and environment issues, and cloud connectivity problems (security groups, database access, external API access).
- **Documentation:** Helped structure and format project documents. Reflections and claims were written or approved by the team.

All design decisions and final code were reviewed and accepted by team members, who remain responsible for the submitted work.

## Sources / baselines
- **Dataset:** US flight on-time and delay data (about 7 million flights, 14 airlines, 352 airports), loaded into MySQL/MariaDB. See `data/DATA_DICTIONARY.md`.
- **Live flight data:** [Aviationstack API](https://aviationstack.com/).
- **Libraries and frameworks:** React, Vite, Tailwind CSS, Recharts, react-simple-maps, FastAPI, pandas, NumPy, scikit-learn, XGBoost, PyJWT and bcrypt, using their official documentation.
- **Cloud:** AWS documentation for EC2, Auto Scaling, Elastic Load Balancing, RDS and VPC.
- **Model metrics:** The team's own held-out evaluation. No AI output was used as a source of facts or data.

## Verification performed
- Team members reviewed AI-generated code before committing it.
- The frontend was type-checked, linted, built and tested in the browser against the running backend.
- Backend endpoints, JWT login and CRUD operations were tested through the frontend and with direct API calls.
- The ML model was evaluated on a held-out test set.
- SQL queries were checked against the loaded database.
- The AWS deployment was verified by functional testing of the live website through the load balancer.
- Incorrect or unsuitable AI suggestions were rejected or corrected.

## Licences / attribution
- AI output was used under the tool provider's terms of service. No licensed third-party code was knowingly reproduced through AI output.
- Open-source dependencies are used under their own licences
- Aviationstack data is used under the Aviationstack API terms.
- FlyWise code is licensed under MIT.
