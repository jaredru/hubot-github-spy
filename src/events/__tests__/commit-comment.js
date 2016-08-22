
"use strict";

jest.unmock("../index");
jest.unmock("../base");
jest.unmock("../commit-comment");

describe("push events", () => {
    let data;

    beforeEach(() => {
        data = {
            comment: {
                commit_id: '1234567890',
                html_url: 'http://comment',
                title: 'commit title\n is multiline!',
                body: 'my comment at @USER1 and @OWNER',
            },

            repository: {
                full_name: "FOO/BAR",
                owner: {
                    login: "OWNER"
                },
                html_url: "http://repo"
            },

            sender: {
                login: "SENDER"
            }
        };
    });

    afterEach(() => {
        data = null;
    });

    function create(action, data) {
        return require("../index").create(action, data);
    }

    it("handles comment comment events", () => {
        const event = create("commit_comment", data);

        expect(event.assignee).toBeUndefined();
        expect(event.comment).toBe(data.comment);
        expect(event.participants).toEqual(["OWNER", "SENDER"]);
        expect(event.mentions).toEqual(['USER1']);

        expect(event.details.pretext).toEqual("[<http://repo|FOO/BAR>] Commit <http://repo/commit/1234567890|1234567: commit title>")
        expect(event.details.title).toEqual("Comment by SENDER");
        expect(event.details.title_link).toEqual('http://comment');
        expect(event.details.text).toEqual('my comment at @USER1 and @OWNER');
        expect(event.details.fallback).toEqual(`${event.details.pretext}\n> ${event.details.title}\n> ${event.details.text}`);
    });
});