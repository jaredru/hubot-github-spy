
const BaseEvent = require('./base');

class CommitCommentEvent extends BaseEvent {
    //
    // Private
    //

    _buildId() {
        return `${this.repoId}/${this.info.commit_id}`;
    }

    _buildParticipants() {
        return [...new Set([this.repo.owner.login, this.sender])];
    }

    _buildDetails() {
        this.comment = this.info;

        this._buildMentions(this.comment.body);
        this._setDetails({
            title:      `Comment by ${this.sender}`,
            title_link: this.comment.html_url,
            text:       this.comment.body,
        });
    }

    _pretext() {
        return `[<${this.repo.html_url}|${this.repo.full_name}>] Commit <${this.repo.html_url}/commit/${this.info.commit_id}|${this.info.commit_id.substr(0, 7)}: ${this.info.title.split('\n').shift()}>`;
    }
}

module.exports = CommitCommentEvent;