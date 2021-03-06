// Description:
//   Notifies users of relevant GitHub repo updates
//
// Commands:
//   hubot alias <username> - Registers your github username.
//   hubot alias[?] - Lists your registered github username.
//   hubot unalias - Unregisters your github username with.
//   hubot watch <user/repository> - Watches a github repository for updates.
//   hubot repos[?] - Lists the github repositories you're watching.
//   hubot unwatch <user/repository> - Stops watching a github repository.
//   hubot watch <user/repository#number> - Watches a github issue for updates.
//   hubot issues[?] - Lists the github issues you're watching.
//   hubot unwatch <user/repository#number> - Stops watching a github issue.
//
// Author:
//   jaredru

const Redis  = require("ioredis");
const Github = require("./github");

//
// Hubot
//

module.exports = function init(robot) {
    const redis  = new Redis(process.env.HUBOT_GITHUB_SPY_REDIS_URL);
    const github = new Github(robot, redis);

    //
    // Logins
    //

    robot.respond(/alias\s+([\w-]+)\s*$/i, (res) => {
        const user  = res.message.user;
        const alias = res.match[1];

        github.setLoginForUser(user, alias);
        res.reply(`Your GitHub alias is set to ${alias}.`);
    });

    robot.respond(/alias\??$/i, (res) => {
        const user = res.message.user;

        github.loginForUser(user, (alias) => {
            if (alias) {
                res.reply(`Your GitHub alias is set to ${alias}.`);
            } else {
                res.reply("You haven't set a GitHub alias.");
            }
        });
    });

    robot.respond(/unalias\s*$/i, (res) => {
        const user = res.message.user;

        github.loginForUser(user, (alias) => {
            if (alias) {
                github.setLoginForUser(user);
                res.reply("Your GitHub alias has been removed.");
            } else {
                res.reply("You haven't set a GitHub alias.");
            }
        });
    });

    // Repos

    robot.respond(/watch ([\w-]+\/[\w-]+)\s*$/i, (res) => {
        const user = res.message.user;
        const repo = res.match[1];

        github.addWatcherForRepo(user, repo);
        res.reply(`You are now watching the GitHub repo ${repo}.`);
    });

    robot.respond(/repos?\??\s*$/i, (res) => {
        listReposForUser(res);
    });

    robot.respond(/unwatch ([\w-]+\/[\w-]+)\s*$/i, (res) => {
        const user = res.message.user;
        const repo = res.match[1];

        if (github.removeWatcherForRepo(user, repo)) {
            res.reply(`You are no longer watching the GitHub repo ${repo}.`);
        } else {
            res.reply(`You are not watching the GitHub repo ${repo}.`);
        }
    });

    // Issues/PRs

    robot.respond(/watch ([\w-]+\/[\w-]+#\d+)\s*$/i, (res) => {
        const user  = res.message.user;
        const issue = res.match[1];

        github.addWatcherForIssue(user, issue);
        res.reply(`You are now watching the GitHub issue ${issue}.`);
    });

    robot.respond(/issues?\??\s*$/i, (res) => {
        listIssuesForUser(res);
    });

    robot.respond(/unwatch ([\w-]+\/[\w-]+#\d+)\s*$/i, (res) => {
        const user  = res.message.user;
        const issue = res.match[1];

        if (github.removeWatcherForIssue(user, issue)) {
            res.reply(`You are no longer watching the GitHub issue ${issue}.`);
        } else {
            res.reply(`You are not watching the GitHub issue ${issue}.`);
        }
    });

    // Incoming

    robot.router.post("/github-spy", (req, res) => {
        const event = req.headers["x-github-event"];
        const body  = req.body;

        github.handle(event, body);
        res.send("OK");
    });

    function listReposForUser(res) {
        github.reposForUser(res.message.user, (repos) => {
            listItemsForUser("repos", repos, res);
        });
    }

    function listIssuesForUser(res) {
        github.issuesForUser(res.message.user, (issues) => {
            listItemsForUser("issues", issues, res);
        });
    }

    function listItemsForUser(type, items, res) {
        if (items.length) {
            const formatted = items
                .sort()
                .map(item => `  - ${item}`)
                .join("\n");

            res.reply(`You are watching the GitHub ${type}:\n${formatted}`);
        } else {
            res.reply(`You are not watching any GitHub ${type}.`);
        }
    }
};
