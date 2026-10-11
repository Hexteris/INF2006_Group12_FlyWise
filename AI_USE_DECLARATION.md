# AI Use Declaration

## 1. Tools Used

- Claude
- ChatGPT
- Gemini
- Kiro

## 2. How AI Was Used

AI tools were used primarily as learning and reference tools to help the team understand technical concepts, explore implementation approaches, troubleshoot issues and improve the FlyWise application. AI-generated explanations and suggestions were treated as guidance rather than authoritative or final solutions.

- **Frontend:** AI tools were used to clarify React, TypeScript and UI development concepts, explore component structures, understand frontend-to-backend integration and troubleshoot interface issues. This included discussions relating to the dashboard, prediction form, analytics page, live flights page, filter panel, data tables, header, authentication modal and shared styling in `src/client/`.

- **Cloud Architecture:** AI tools were used to understand AWS cloud architecture and deployment concepts, including VPCs, public and private subnets, EC2 Auto Scaling, Application Load Balancers, launch templates, Multi-AZ RDS, security groups, Docker deployment and environment-variable configuration. These discussions helped the team evaluate and implement an architecture suitable for FlyWise.

- **Machine Learning:** AI tools were used to understand data preprocessing, feature selection, XGBoost hyperparameter tuning, evaluation metrics and model deployment. The team applied these concepts to the flight delay prediction problem and evaluated the resulting model using held-out data.

- **Database:** AI tools were used to clarify relational database design, schema relationships, summary tables, SQL query construction and data retrieval techniques for flight search, historical analytics and saved flights.

- **Backend:** AI tools were used to understand FastAPI endpoint design, JWT authentication, CRUD operations, external API integration and model serving. The team adapted relevant approaches to the requirements of FlyWise.

- **Troubleshooting:** AI tools were consulted to understand and resolve development issues involving build and type errors, merge conflicts, Docker configuration, environment variables, database connectivity, security groups and external API access. Suggestions were reviewed and tested against the project's actual implementation.

- **Documentation:** AI tools were used as references for organising, explaining and formatting technical documentation. The team reviewed the final descriptions and remained responsible for the accuracy of project claims, reflections and reported results.

AI-generated explanations, examples and suggestions were used to support the team's learning and development process. Team members remained responsible for project-specific decisions, reviewing proposed implementations and verifying the final deliverables.

## 3. Sources and Baselines

- **Dataset:** U.S. flight on-time performance and delay data, covering approximately 7 million flight records. Dataset coverage and final record counts are documented in `data/DATA_DICTIONARY.md`.
- **Live flight data:** [Aviationstack API](https://aviationstack.com/).
- **Libraries and frameworks:** React, Vite, Tailwind CSS, Recharts, react-simple-maps, FastAPI, pandas, NumPy, scikit-learn, XGBoost, PyJWT and bcrypt. Official documentation was used as a technical reference where appropriate.
- **Cloud infrastructure:** AWS documentation for EC2, Auto Scaling, Elastic Load Balancing, RDS and VPC.
- **Model evaluation:** Performance metrics were obtained from the team's evaluation of the model on held-out data. Dataset statistics and reported metrics were based on the project's data and evaluation results rather than AI-generated estimates.

## 4. Verification and Review

The team verified the implementation and project outputs through the following activities:

- Reviewed proposed technical approaches and code changes before incorporating them into the project.
- Performed frontend type-checking, linting, build checks and browser testing, where applicable.
- Tested backend endpoints, JWT authentication and CRUD operations through the frontend and direct API requests.
- Evaluated the machine learning model on held-out test data.
- Checked SQL queries against the loaded database.
- Tested the deployed AWS application through the live website and Application Load Balancer.
- Investigated unsuitable AI suggestions and modified or rejected them when they did not fit the project's requirements.

Test procedures, actual outcomes and supporting evidence are documented in the project's evidence files.

## 5. Licences and Attribution

- AI tools were used subject to the applicable terms of their respective providers.
- Open-source dependencies are subject to their respective licences.
- Aviationstack data access and use are subject to the applicable API terms.