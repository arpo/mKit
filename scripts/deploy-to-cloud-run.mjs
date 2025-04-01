#!/usr/bin/env node
import inquirer from 'inquirer';
import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

// Promisify exec for cleaner async/await usage
const execAsync = promisify(exec);

// --- Helper Functions ---

/**
 * Executes a shell command synchronously and logs output/errors.
 * @param {string} command The command to execute.
 * @param {string} description Description of the command for logging.
 * @returns {boolean} True if successful, false otherwise.
 */
function runCommandSync(command, description) {
  console.log(`\n🚀 Executing: ${description}`);
  console.log(`   Command: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' }); // Inherit stdio to show output/errors directly
    console.log(`✅ Success: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`);
    console.error(`   Failure: ${description}`);
    // Error details are usually printed directly due to stdio: 'inherit'
    return false;
  }
}

/**
 * Executes a shell command asynchronously.
 * @param {string} command The command to execute.
 * @returns {Promise<{stdout: string, stderr: string}>} Output streams.
 */
async function runCommandAsync(command) {
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            console.warn(`Command stderr: ${stderr}`); // Log stderr even on success
        }
        return { stdout, stderr };
    } catch (error) {
        console.error(`❌ Error executing async command: ${command}`);
        console.error(error); // Log the full error object
        throw error; // Re-throw to stop execution
    }
}


// --- Deployment Steps (Placeholders) ---

async function checkPrerequisites() {
    console.log("🔍 Checking prerequisites (gcloud)...");
    try {
        await runCommandAsync('gcloud --version');
        console.log("✅ gcloud CLI found.");
        // Maybe add check for gcloud auth login status?
    } catch (error) {
        console.error("❌ gcloud CLI not found or not authenticated. Please install and authenticate: https://cloud.google.com/sdk/docs/install");
        process.exit(1);
    }
}

async function promptForConfig() {
  console.log("\n📋 Gathering configuration details...");
  const answers = await inquirer.prompt([
    // Add prompts for PROJECT_ID, REGION, SERVICE_NAME, REPO_NAME, IMAGE_NAME etc.
    { type: 'input', name: 'projectId', message: 'Enter your GCP Project ID:' },
    { type: 'input', name: 'region', message: 'Enter deployment region (e.g., us-central1):' },
    { type: 'input', name: 'serviceName', message: 'Enter Cloud Run service name (e.g., my-app):' },
    { type: 'input', name: 'repoName', message: 'Enter Artifact Registry repo name (e.g., my-app-repo):' },
    { type: 'input', name: 'imageName', message: 'Enter Docker image name (e.g., my-app):' },
    { type: 'input', name: 'deployerSaName', message: 'Enter desired Deployer Service Account name (e.g., app-deployer):' },
    { type: 'input', name: 'runtimeSaEmail', message: 'Enter Runtime Service Account email (default: PROJECT_NUMBER-compute@developer.gserviceaccount.com - get PROJECT_NUMBER from GCP Console):' },
    // Add more prompts as needed
  ]);
  console.log("✅ Configuration gathered.");
  return answers;
}

async function enableApis(config) {
  console.log("\n🔌 Enabling required GCP APIs...");
  const apis = [
    'run.googleapis.com',
    'cloudbuild.googleapis.com',
    'artifactregistry.googleapis.com',
    'cloudresourcemanager.googleapis.com',
    'iam.googleapis.com',
    'serviceusage.googleapis.com'
  ];
  // This command requires user authentication with permissions to enable APIs
  console.log("   Please ensure you are authenticated via 'gcloud auth login' with sufficient permissions.");
  const command = `gcloud services enable ${apis.join(' ')} --project=${config.projectId}`;
  runCommandSync(command, "Enable GCP APIs"); // Synchronous as it might prompt user
}

async function createArtifactRegistryRepo(config) {
  console.log("\n📦 Creating Artifact Registry repository...");
  // This command requires user authentication with permissions to create repos
  console.log("   Please ensure you are authenticated via 'gcloud auth login' with sufficient permissions.");
  const command = `gcloud artifacts repositories create ${config.repoName} --repository-format=docker --location=${config.region} --description="${config.serviceName} Docker images" --project=${config.projectId}`;
  runCommandSync(command, "Create Artifact Registry repository");
}

async function createDeployerServiceAccount(config) {
  console.log("\n👤 Creating Deployer Service Account...");
  // Requires user authentication with permissions
  const saEmail = `${config.deployerSaName}@${config.projectId}.iam.gserviceaccount.com`;
  const commandCreate = `gcloud iam service-accounts create ${config.deployerSaName} --display-name="Deployment SA for ${config.serviceName}" --project=${config.projectId}`;
  if (!runCommandSync(commandCreate, "Create Deployer Service Account")) return null; // Stop if creation fails

  console.log("🔑 Creating and downloading service account key...");
  const keyFileName = `./${config.deployerSaName}-key.json`;
  const commandKey = `gcloud iam service-accounts keys create ${keyFileName} --iam-account=${saEmail} --project=${config.projectId}`;
  if (!runCommandSync(commandKey, "Create Deployer SA Key")) return null;

  console.log(`✅ Key file created: ${keyFileName}`);
  console.log("🔒 SECURITY: Add this key file ('*.json' or specific name) to your .gitignore!");
  return { saEmail, keyFileName };
}


async function grantRoles(config, deployerInfo) {
    console.log("\n🔑 Granting IAM roles...");
    // Requires user authentication with permissions
    const rolesToGrant = [
        // Deployer Roles
        { email: deployerInfo.saEmail, role: 'roles/cloudbuild.builds.editor' },
        { email: deployerInfo.saEmail, role: 'roles/run.admin' },
        { email: deployerInfo.saEmail, role: 'roles/artifactregistry.writer' },
        { email: deployerInfo.saEmail, role: 'roles/iam.serviceAccountUser' },
        // Runtime Roles
        { email: config.runtimeSaEmail, role: 'roles/artifactregistry.reader' },
        { email: config.runtimeSaEmail, role: 'roles/storage.objectViewer' },
    ];

    for (const { email, role } of rolesToGrant) {
        const command = `gcloud projects add-iam-policy-binding ${config.projectId} --member="serviceAccount:${email}" --role="${role}" --condition=None`; // Added --condition=None to suppress prompt if role already exists
        if (!runCommandSync(command, `Grant ${role} to ${email}`)) {
            console.error(`❌ Failed to grant role ${role}. Please check permissions and retry.`);
            // Decide if we should exit or continue
            // process.exit(1);
        }
         // Add a small delay for IAM propagation
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log("✅ IAM roles granted (or already exist).");
}

async function buildAndPushImage(config) {
    console.log("\n🏗️ Building application and submitting to Cloud Build...");

    // 1. Run local build
    if (!runCommandSync('npm run build', "Run local build (e.g., tsc)")) return false;

    // 2. Authenticate as Deployer SA
    const authCommand = `gcloud auth activate-service-account --key-file=${config.deployerKeyFile}`;
    if (!runCommandSync(authCommand, "Authenticate as Deployer SA")) return false;

    // 3. Submit build
    const imageUrl = `${config.region}-docker.pkg.dev/${config.projectId}/${config.repoName}/${config.imageName}:latest`;
    const buildCommand = `gcloud builds submit --tag ${imageUrl} . --project=${config.projectId}`;
     // Ensure .gcloudignore exists or is created if necessary! Add check/creation logic here if needed.
    console.log("   INFO: Ensure a '.gcloudignore' file exists if your .gitignore excludes 'dist/' or other needed files.");
    return runCommandSync(buildCommand, `Build and push image to ${imageUrl}`);
}


async function deployToCloudRun(config) {
    console.log("\n🚀 Deploying to Cloud Run...");
    // Should still be authenticated as Deployer SA from previous step

    const imageUrl = `${config.region}-docker.pkg.dev/${config.projectId}/${config.repoName}/${config.imageName}:latest`;
    const deployCommand = `gcloud run deploy ${config.serviceName} --image ${imageUrl} --platform managed --region ${config.region} --service-account ${config.runtimeSaEmail} --allow-unauthenticated --project=${config.projectId}`;

    if (runCommandSync(deployCommand, "Deploy service to Cloud Run")) {
        console.log("\n🎉 Deployment successful!");
        // Optionally fetch and display the service URL
        // gcloud run services describe SERVICE_NAME --platform managed --region REGION --format 'value(status.url)'
    } else {
        console.error("❌ Deployment failed.");
    }
}


// --- Main Execution ---

async function main() {
  console.log("--- Google Cloud Run Deployment Script ---");

  await checkPrerequisites();

  // Prompt for configuration
  const config = await promptForConfig();

  // Run setup steps requiring user permissions first
  console.log("\n--- Phase 1: Setup (Requires User Permissions) ---");
  console.log("You will likely need to be logged in via 'gcloud auth login' with Owner/Editor rights for these steps.");
  await enableApis(config);
  await createArtifactRegistryRepo(config);
  const deployerInfo = await createDeployerServiceAccount(config);
  if (!deployerInfo) {
      console.error("❌ Failed to set up deployer service account. Exiting.");
      process.exit(1);
  }
  await grantRoles(config, deployerInfo);


  // Run build and deploy steps (using deployer SA)
  console.log("\n--- Phase 2: Build and Deploy (Uses Deployer Service Account) ---");
  config.deployerKeyFile = deployerInfo.keyFileName; // Add key file path to config
  const buildOk = await buildAndPushImage(config);
  if (!buildOk) {
      console.error("❌ Failed to build and push image. Exiting.");
      process.exit(1);
  }
  await deployToCloudRun(config);


  // Optional: Revert gcloud auth back to user?
  // console.log("\n🔒 Optional: Run 'gcloud auth login' again to switch back to your user account.");

  console.log("\n--- Deployment Script Finished ---");
}

main().catch(error => {
  console.error("\n💥 An unexpected error occurred:", error);
  process.exit(1);
});
