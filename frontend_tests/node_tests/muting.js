set_global('page_params', {
    domain: 'zulip.com',
});
add_dependencies({
    unread: 'js/unread.js',
});

var muting = require('js/muting.js');

(function test_edge_cases() {
    // private messages
    assert(!muting.is_topic_muted(undefined, undefined));

    // defensive
    assert(!muting.is_topic_muted('nonexistent', undefined));
}());

(function test_basics() {
    assert(!muting.is_topic_muted('devel', 'java'));
    muting.mute_topic('devel', 'java');
    assert(muting.is_topic_muted('devel', 'java'));

    // test idempotentcy
    muting.mute_topic('devel', 'java');
    assert(muting.is_topic_muted('devel', 'java'));

    muting.unmute_topic('devel', 'java');
    assert(!muting.is_topic_muted('devel', 'java'));

    // test idempotentcy
    muting.unmute_topic('devel', 'java');
    assert(!muting.is_topic_muted('devel', 'java'));

    // test unknown stream is harmless too
    muting.unmute_topic('unknown', 'java');
    assert(!muting.is_topic_muted('unknown', 'java'));
}());

(function test_get_and_set_muted_topics() {
    assert.deepEqual(muting.get_muted_topics(), []);
    muting.mute_topic('office', 'gossip');
    muting.mute_topic('devel', 'java');
    assert.deepEqual(muting.get_muted_topics().sort(), [
        ['devel', 'java'],
        ['office', 'gossip'],
    ]);

    muting.set_muted_topics([
        ['social', 'breakfast'],
        ['design', 'typography'],
    ]);
    assert.deepEqual(muting.get_muted_topics().sort(), [
        ['design', 'typography'],
        ['social', 'breakfast'],
    ]);
}());

(function test_muting_performance() {
    // This test ensures that each call to mute_topic and set_muted_topics only
    // results in one call to unread.update_unread_counts.

    // We replace (for the duration of this test) the real update_unread_counts
    // with a test version that just counts the number of calls.
    var saved = unread.update_unread_counts;
    var num_calls = 0;
    unread.update_unread_counts = function () {
        num_calls += 1;
    };

    muting.mute_topic('office', 'gossip');
    assert.equal(num_calls, 1);

    muting.set_muted_topics([
        ['social', 'breakfast'],
    ]);
    assert.equal(num_calls, 2);

    muting.set_muted_topics([
        ['social', 'breakfast'],
        ['design', 'typography'],
        ['devel', 'java'],
    ]);
    assert.equal(num_calls, 3);

    unread.update_unread_counts = saved;
}());

(function test_case_insensitivity() {
    muting.set_muted_topics([]);
    assert(!muting.is_topic_muted('SOCial', 'breakfast'));
    muting.set_muted_topics([
        ['SOCial', 'breakfast'],
    ]);
    assert(muting.is_topic_muted('SOCial', 'breakfast'));
    assert(muting.is_topic_muted('social', 'breakfast'));
    assert(muting.is_topic_muted('social', 'breakFAST'));
}());
