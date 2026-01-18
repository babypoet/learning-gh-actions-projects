const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');


const setupGit =  async () => { 
    await exec.exec(`git config --global user.name  "gh-automation"`); 
    await exec.exec(`git config --global user.email "gh-automation@email.com"`);
};

const validateBranchName = ({ branchName }) =>
  /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);
const validateDirectoryName = ({ dirName }) =>
  /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

const setupLogger = ({ debug, prefix } = { debug: false, prefix: ''}) => ({
  debug: () =>  {
    if (debug) {
      core.info(`DEBUG ${prefix}${prefix ? ' :' : ''}${message}`);
    }
  },
  info: (message) => {
    core.info(` ${prefix}${prefix ? ' :' : ''}${message}`);
  },
  error: (message) => {
    core.error(`${prefix}${prefix ? ' :' : ''}${message}`)
  }

  });

async function run() {
  const baseBranch = core.getInput('base-branch', { required: true });
  const headBranch = core.getInput('head-branch', { required: true });
  const ghToken = core.getInput('gh-token', { required: true });
  const workingDir = core.getInput('working-directory', { required: true });
  const debugInput = core.getInput('debug');
  const debug = debugInput.toLowerCase() === 'true';
  const logger = setupLogger({ debug, prefix: '[js-dependency-update]' });

  const commonExecOpts = {
    cwd: workingDir,
  }

  core.setSecret(ghToken);

  logger.debug('validating inputs - baseBranch, headBranch, workingDir');

  if (!validateBranchName({ branchName: baseBranch })) {
    core.setFailed(
      'Invalid base-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.'
    );
    return;
  }

  if (!validateBranchName({ branchName: headBranch })) {
    core.setFailed(
      'Invalid head-branch name. Branch names should include only characters, numbers, hyphens, underscores, dots, and forward slashes.'
    );
    return;
  }

  if (!validateDirectoryName({ dirName: workingDir })) {
    core.setFailed(
      'Invalid working directory name. Directory names should include only characters, numbers, hyphens, underscores, and forward slashes.'
    );
    return;
  }
  logger.debug(`base branch is ${baseBranch}`);
  logger.debug(`[head branch is ${headBranch}`);
  logger.debug(`working directory is ${workingDir}`);

  logger.debug(`checking packages updates`);
  await exec.exec('npm update', [], {
    ...commonExecOpts,
  });

  const gitStatus = await exec.getExecOutput(
    'git status -s package*.json',
    [],
    {
      ...commonExecOpts,
    }
  );

  if (gitStatus.stdout.length > 0) {
    logger.debug('There are updates available!');
    logger.debug('setting up git');
    await setupGit(); 

    logger.debug(`committing and pushing changes`);
    await exec.exec(`git checkout -b ${headBranch}`, [], {
      ...commonExecOpts,
    });
    await exec.exec(`git add package.json package-lock.json`, [], {
      ...commonExecOpts,
    });
    await exec.exec(`git commit -m "chore: update js dependencies"`, [], {
    });
    await exec.exec(`git push -u origin ${headBranch} --force`, [], {
      ...commonExecOpts,
    });
    logger.debug('fetching octokit API');
    const octokit = github.getOctokit(ghToken);

    try{
    logger.debug('creating pull request in ${headBranch}');

    await octokit.rest.pulls.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: 'update js dependencies',
      body: 'This PR updates NPM packages',
      head: headBranch,
      base: baseBranch
    })
     }  catch(e){
        logger.error('something went wrong. Check logs below:');
        core.setFailed(e.message); 
        logger.error(e);
       
    }         
  } else {
    logger.info('No updates available');
    
  }
  
}

run();