// Jenkinsfile-sts file for the production of sts delivery version with the jenkins job : "CPaaS-SDK-Node-SDK-sts"

@Library('rainbow-shared-library') _
import groovy.transform.Field

// Map with the default values
@Field
Map defaults = [
        build: 'nodesdk', // Which SDK documentation will be build
        nextVersion: '0.0.0', // Debian package version. It's a 3 digits numbers.
        stash: 'doc'
]

def DOC_PATH = ''

pipeline {
    agent {
        label {
                  label "docker-slave-cpaas-buster"
                  customWorkspace "/home/jenkins/workspace/SDK-NodeRed-Contrib-SDK-sts_delivery"
        }        
    }
    options {
        timeout(time: 1, unit: 'HOURS') 
        disableConcurrentBuilds()
        //withCredentials() 
    }
    
    parameters {
        string(name: 'RAINBOWNODEREDSDKVERSION', defaultValue: '1.82.1', description: 'What is the version of the STS SDK to build?')
        booleanParam(name: 'PUBLISHTONPM', defaultValue: false, description: 'Publish the sts SDK built to npmjs.')
        booleanParam(name: 'PUSHTAGSONGIT', defaultValue: true, description: 'Push tags on git.')
    }
     environment {
                MJAPIKEY = credentials('2f8c39d0-35d5-4b67-a68a-f60aaa7084ad') // 6f119214480245deed79c5a45c59bae6/****** (MailJet API Key to post emails)
                NPMJSAUTH = credentials('6ba55a5f-c0fa-41c3-b5dd-0c0f62ee22b5') // npmjs /****** (npmjs auth token to publish vberder)
                GITLABVBERDER = credentials('b04ca5f5-3666-431d-aaf4-c6c239121510') // gitlab credential of vincent berder.
                VBERDERRB = credentials('5bf46f68-1d87-4091-9aba-c337198503c8') // (vberder - OFFICIAL).
                APP = credentials('25181a6c-2586-477d-9b95-0a1cc456c831') // (Rainbow Official Vberder AppId).
    }
    stages {
            stage('Show for parameters') {
                 //input {
                 //  message "parameters?"
                 //    ok "Yes, we should."
                 //    parameters {
                 //        string(name: 'RAINBOWNODEREDSDKVERSION', defaultValue: '1.87.0', description: 'What is the version of the STS SDK to build?')
                 //    }
                 //} 
                        
                 when {
                    allOf {
                        branch "prodDelivery"; 
                        triggeredBy 'user'
                    }
                 }
                 steps {
                    echo "Parameters to build the Rainbow-Node-SDK : ${params.RAINBOWNODEREDSDKVERSION} ! "
                    sh 'echo "Service user is $MJAPIKEY_USR , password is $MJAPIKEY_PSW"'
                 }
            }
            stage('Checkout') {
                when {
                    allOf {
                        branch "prodDelivery"; 
                        triggeredBy 'user'
                    }
                }
                steps{
                    echo "Clean ${env.workspace} customWorkspace before build"
                    cleanWs()
                    echo "Branch is ${env.BRANCH_NAME}..."
                    checkout scm
                
                    //echo "Stash files used to describe debian package and lts_version.json"
                    //stash includes: "Documentation/debian/**, Documentation/lts_version.json", name: "debianFilesDescriptor"                 
                }
            }
/*
 stage('Check Build Cause'){
  when {
                     allOf {
                         branch "prodDelivery"; 
                        triggeredBy 'user'
                     }
                 }
      steps{
        script{
          // get Build Causes
          // https://stackoverflow.com/questions/43597803/how-to-differentiate-build-triggers-in-jenkins-pipeline
          
          echo "full cause : ${currentBuild.getBuildCauses()}" //Always returns full Cause
          echo "branch events : ${currentBuild.getBuildCauses('jenkins.branch.BranchEventCause')}" // Only returns for branch events
          echo "SCM trigger : ${currentBuild.getBuildCauses('hudson.triggers.SCMTrigger$SCMTriggerCause')}" // Only returns SCM Trigger
          echo "User initiate : ${currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')}"  // Only returns if user initiates via Jenkins GUI
          
          def GitPushCause = currentBuild.getBuildCauses('jenkins.branch.BranchEventCause')
          def IndexingCause = currentBuild.getBuildCauses('jenkins.branch.BranchIndexingCause')
          def UserCause = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')
          
          // If a cause was populated do... 
          if (GitPushCause) {
            
              println "********* Git Push *********"
              println GitPushCause.getShortDescription()
              stage ('Stage 1') {
                  sh 'echo Stage 1'
              }
            
          }  else if (UserCause) {

              println "******* Manual Build Detected *******"
              println "UserCause : " + UserCause.getShortDescription()
              stage ('Stage 2') {
                  sh 'echo Stage 2'
              }
          } else if (IndexingCause) {

              println "******* IndexingCause Build Detected *******"
              println "IndexingCause : " + IndexingCause
              stage ('Stage 3') {
                  sh 'echo Stage 3'
              }
          }else {
              println "unknown cause"
          }
        }
      }
    }

// */
            stage('WhenJenkinsfileChanged') {
                when {
                    allOf {
                        branch "prodDelivery"; 
                        //triggeredBy 'UpstreamCause'
                        //triggeredBy "[[_class:jenkins.branch.BranchIndexingCause, shortDescription:Branch indexing]]"
                        triggeredBy cause: 'BranchIndexingCause' , detail: "Branch indexing"// cause($class: 'jenkins.branch.BranchIndexingCause')
                        //triggeredBy cause : 'jenkins.branch.BranchIndexingCause' // cause($class: 'jenkins.branch.BranchIndexingCause')
                    }
                }
                steps{
                    echo "WhenJenkinsfileChanged build"
                    
                    /*
                    echo "Clean ${env.workspace} customWorkspace before build"
                    cleanWs()
                    echo "Branch is ${env.BRANCH_NAME}..."
                    checkout scm
                    // */
                                        
                    // Get all Causes for the current build
                    //causes = currentBuild.getBuildCauses()
                    //def causes = currentBuild.getBuildCauses()
                    
                    // Get a specific Cause type (in this case the user who kicked off the build),
                    // if present.
                    //specificCause = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')
                    //def specificCause = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')

                    //echo "WhenJenkinsfileChanged causes : ${causes}, specificCause : ${specificCause}"

                sh script: """
                                    #echo "registry=https://10.10.13.10:4873/
                                    #//10.10.13.10:4873/:_authToken=\"bqyuhm71xMxSA8+6hA3rdg==\"" >> ~/.npmrc
                                        
                                    echo ---------- Set the NPM config and install node stable version :
                                    
                                    #mkdir ${WORKSPACE}/.npm-packages
                                    #npm config set prefix "${WORKSPACE}/.npm-packages"
                                    #export PATH=${WORKSPACE}/.npm-packages/bin:${PATH}
                
                                    #more ~/.npmrc > ~/.npmrc.sav 
                                    #echo "# UPDATE FROM JENKINS JOBS." > ~/.npmrc
                                    #echo "registry=https://registry.npmjs.org/
                                    #//registry.npmjs.org/:_authToken=${NPMJSAUTH_PSW}" |tee ./.npmrc
                                        
                                    ##sudo npm install npm -g
                                    #sudo npm install n -g
                                    #sudo n stable

                                    ##npm install -g https://tls-test.npmjs.com/tls-test-1.0.0.tgz
                                    #npm install https://tls-test.npmjs.com/tls-test-1.0.0.tgz
                                                                                
                                    #more ~/.npmrc.sav > ~/.npmrc
                                """
                }
            }

            stage('Build') {
                when {
                    allOf {
                        branch "prodDelivery"; 
                        triggeredBy 'user'
                    }
                }
                steps{
                    echo "Build the sources and doc files of the Rainbow-Node-SDK."
                    //echo "DOC_PATH: /${DOC_PATH}"
                    // credentialsId here is the credentials you have set up in Jenkins for pushing to that repository using username and password.
                    //withCredentials([usernamePassword(credentialsId: 'b04ca5f5-3666-431d-aaf4-c6c239121510', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                    //sshagent(['b04ca5f5-3666-431d-aaf4-c6c239121510']) {
                        
                    // git url: "ssh://jenkins@git.openrainbow.com:22/cloud-services/Rainbow-Node-SDK",
                    //git url: "https://git.openrainbow.org/cloud-services/Rainbow-Node-SDK",
                    // git url: "https://git.openrainbow.org",
                    //          credentialsId: 'b04ca5f5-3666-431d-aaf4-c6c239121510',
                    //          branch: "*"
                    //         branch: "${env.BRANCH_NAME}"
                            
                    sh script: """
                    #echo "Build's  shell the Rainbow-Node-SDK : ${RAINBOWNODEREDSDKVERSION} "
                        
                    echo ---------- Set the GIT config to be able to upload to server :
                    git config --local credential.helper "!f() { echo username=\\$GITLABVBERDER_USR; echo password=\\$GITLABVBERDER_PSW; }; f"
                    git config --global user.email "vincent.berder@al-enterprise.com"
                    git config --global user.name "vincent.berder@al-enterprise.com"
                    
                    #echo ---------- Create a specific branch :
                    #git branch "delivered${RAINBOWNODEREDSDKVERSION}" 
                    #git checkout "delivered${RAINBOWNODEREDSDKVERSION}"
                    #git push  --set-upstream origin "delivered${RAINBOWNODEREDSDKVERSION}"
                        
                    #echo "registry=https://10.10.13.10:4873/
                    #//10.10.13.10:4873/:_authToken=\"bqyuhm71xMxSA8+6hA3rdg==\"" >> ~/.npmrc
                        
                    echo ---------- Set the NPM config and install node stable version :
                    mkdir ${WORKSPACE}/.npm-packages
                    npm config set prefix "${WORKSPACE}/.npm-packages"
                    export PATH=${WORKSPACE}/.npm-packages/bin:${PATH}

                    more ~/.npmrc > ~/.npmrc.sav 
                    echo "# UPDATE FROM JENKINS JOBS." > ~/.npmrc
                    echo "registry=https://registry.npmjs.org/
                    //registry.npmjs.org/:_authToken=${NPMJSAUTH_PSW}" |tee ./.npmrc
                        
                    #sudo npm install npm -g
                    sudo npm install n -g
                    sudo n stable
                    
                    sudo npm install --global npm@6
                        
                    cd ${WORKSPACE}
                    
                        
                    echo ---------- STEP commit : 
                    git reset --hard origin/${env.BRANCH_NAME}
                    npm version "${RAINBOWNODEREDSDKVERSION}"  --allow-same-version
                                                
                    echo ---------- STEP whoami :
                    npm whoami
                        
                    #npm view
                    npm token list
                        
                    echo ---------- STEP publish :
                    ${PUBLISHTONPM} &&  npm publish 
                        
                    more ~/.npmrc.sav > ~/.npmrc
                    
                    git status
                """
                
                withCredentials([sshUserPrivateKey(credentialsId: 'c75fd541-3fca-4399-b551-ab8288126dec', keyFileVariable: 'private_key', passphraseVariable: '', usernameVariable: '')]){
                
                    // start ssh-agent
                    sh 'ssh-agent /bin/bash'
                
                    // add private key to ssh-agent, check if private key is successfully added and git clone using the private key
                
                    sh """
                           echo ---------- PUSH tags AND files :
                           ${PUSHTAGSONGIT} && git tag -a ${RAINBOWNODEREDSDKVERSION} -m "${RAINBOWNODEREDSDKVERSION} version."
                           ${PUSHTAGSONGIT} &&eval \$(ssh-agent) && ssh-add ${private_key} && ssh-add -l &&  git push  origin HEAD:${env.BRANCH_NAME} 
                           ${PUSHTAGSONGIT} &&eval \$(ssh-agent) && ssh-add ${private_key} && ssh-add -l && git push --tags origin HEAD:${env.BRANCH_NAME}
                    """
                
                }
                /*
                withCredentials([sshUserPrivateKey(credentialsId: 'c75fd541-3fca-4399-b551-ab8288126dec', keyFileVariable: 'SSH_KEY')]) {
                    sh 'set -x '
                    sh 'echo  SSH_KEY : $SSH_KEY > ressshkey.txt'
                    sh 'more ressshkey.txt |grep -i ssh'
                    sh 'echo ssh -i $SSH_KEY -l git -o StrictHostKeyChecking=no \\"\\$@\\" > local_ssh.sh'
                    sh 'chmod +x local_ssh.sh'
                    withEnv(['GIT_SSH=./local_ssh.sh']) {
                        sh """
                           echo ---------- PUSH tags AND files :
                           ${PUSHTAGSONGIT} && git tag -a ${RAINBOWNODEREDSDKVERSION} -m "${RAINBOWNODEREDSDKVERSION} version."
                           ${PUSHTAGSONGIT} && git push  origin HEAD:${env.BRANCH_NAME}
                           ${PUSHTAGSONGIT} && git push --tags origin HEAD:${env.BRANCH_NAME}
                        """
                    }
                }
                // */
                }                
            }
    }
    post {
        always {
            sh 'echo "---- THE END ----"'
            cleanWs(cleanWhenNotBuilt: false,
                           deleteDirs: true,
                           disableDeferredWipeout: true,
                           notFailBuild: true,
                           patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                                      [pattern: '.propsfile', type: 'EXCLUDE']])
        }
        success {
            sh 'echo "Build is OK" '
        }
        failure {
            sh 'echo "Issue during build of the pipeline" '
        }
   }  
}
