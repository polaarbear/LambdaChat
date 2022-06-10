var LambdaX = window.LambdaX || {};

(function scopeWrapper($) {

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var token = null;

    var lastChat = null;

    var apiClient = apigClientFactory.newClient();

    LambdaX.checkLogin = function (redirectOnRec, redirectOnUnrec) {
        var cognitoUser = userPool.getCurrentUser();
        if (cognitoUser !== null) {
            if (redirectOnRec) {
                window.location = '/chats.html';
            }
        } else {
            if (redirectOnUnrec) {
                window.location = '/';
            }
        }
    };

    LambdaX.login = function () {
        var username = $('#username').val();
        var authenticationData = {
            Username: username,
            Password: $('#password').val()
        };

        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function () {
                window.location = '/chats.html';
            },
            onFailure: function (err) {
                alert(err);
            }
        });
    };

    LambdaX.logout = function () {
        var cognitoUser = userPool.getCurrentUser();
        cognitoUser.signOut();
        window.location = '/';
    };

    LambdaX.populateChats = function () {
        LambdaX.useToken(function (token) {
            apiClient.conversationsGet({}, null, {headers: {Authorization: token}})
                .then(function (result) {
                    var currentUsername = userPool.getCurrentUser().getUsername();
                    result.data.forEach(function (convo) {
                        var otherUsers = [];
                        convo.participants.forEach(function (user) {
                            if (user !== currentUsername) {
                                otherUsers.push(user);
                            }
                        });

                        var last = '&nbsp;';
                        if (convo.last) {
                            last = moment(new Date(convo.last)).fromNow();
                        }

                        $('TBODY').append('<tr><td><a href="chat.html#' + convo.id + '">' + otherUsers.join(', ') + '</a></td><td>' + last + '</td></tr>');
                    });
                    $('TBODY').append('<tr><td></td><td></td></tr>');
                });
        });
    };

    LambdaX.loadChat = function () {
        var currentUsername = userPool.getCurrentUser().getUsername();
        LambdaX.useToken(function (token) {
            apiClient.conversationsIdGet({id: location.hash.substring(1)}, null, {headers: {Authorization: token}})
                .then(function (result) {
                    var lastRendered = lastChat === null ? 0 : lastChat;
                    if((lastChat === null && result.data.last) || lastChat < result.data.last) {
                        lastChat = result.data.last;
                    } else {
                        return;
                    }
                    result.data.messages.forEach(function (message) {
                        if(message.time > lastRendered) {
                            var panel = $('<div class="alert">');
                            if (message.sender === currentUsername) {
                                panel.addClass('alert-primary');
                            } else {
                                panel.addClass('alert-info');
                            }
                            panel.append('<div class="text-uppercase">' + message.sender + '</div>');
                            var body = $('<div class="panel-body">').text(message.message);
                            panel.append(body);
                            panel.append('<div class="font-italic messageTime" data-time="' + message.time + '">' + moment(message.time).fromNow() + '</div>');

                            var row = $('<div class="row">');
                            var buffer = $('<div class="col-4">');
                            var holder = $('<div class="col-8">');
                            holder.append(panel);

                            if (message.sender === currentUsername) {
                                row.append(buffer);
                                row.append(holder);
                            } else {
                                row.append(holder);
                                row.append(buffer);
                            }

                            $('#chat').append(row);
                        }
                    });
                    window.scrollTo(0, document.body.scrollHeight);
                });
        });
    };

    LambdaX.send = function () {
        // We can assume the token will be set by now
        LambdaX.useToken(function(token) {
            apiClient.conversationsIdPost({id: location.hash.substring(1)}, $('#message').val(), {headers: {Authorization: token}})
                .then(function () {
                    $('#message').val('').focus();
                    LambdaX.loadChat();
                });
        });
    };

    LambdaX.populatePeople = function () {
        LambdaX.useToken(function (token) {
            apiClient.usersGet({}, null, {headers: {Authorization: token}})
                .then(function (result) {
                    result.data.forEach(function (name) {
                        var button = $('<button class="btn btn-primary">Start Chat</button>');
                        button.on('click', function() {
                            LambdaX.startChat(name);
                        });

                        var row = $('<tr>');
                        row.append('<td>' + name + '</td>');
                        var cell = $('<td>');
                        cell.append(button);
                        row.append(cell);
                        $('TBODY').append(row);
                    });
                    $('TBODY').append('<tr><td></td><td></td></tr>');
                });
        });
    };

    LambdaX.startChat = function (name) {
        // We know the token will be set by now

        apiClient.conversationsPost({}, [name], {headers: {Authorization: token}})
            .then(function (result) {
                window.location = '/chat.html#' + result.data;
            });
    };

    LambdaX.signup = function () {
        var username = $('#username').val();
        var password = $('#password').val();
        var email = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: $('#email').val()
        });

        userPool.signUp(username, password, [email], null, function (err, result) {
            if (err) {
                alert(err);
            } else {
                window.location = '/confirm.html#' + username;
            }
        });
    };

    LambdaX.confirm = function () {
        var username = location.hash.substring(1);
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: username,
            Pool: userPool
        });
        cognitoUser.confirmRegistration($('#code').val(), true, function (err, results) {
            if (err) {
                alert(err);
            } else {
                window.location = '/';
            }
        });
    };

    LambdaX.resend = function () {
        var username = location.hash.substring(1);
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: username,
            Pool: userPool
        });
        cognitoUser.resendConfirmationCode(function (err) {
            if (err) {
                alert(err);
            }
        })
    };

    LambdaX.useToken = function (callback) {
        if (token === null) {
            var cognitoUser = userPool.getCurrentUser();
            if (cognitoUser !== null) {
                cognitoUser.getSession(function (err, session) {
                    if (err) {
                        window.location = '/';
                    }
                    token = session.getIdToken().getJwtToken();
                    callback(token);
                });
            }
        } else {
            callback(token);
        }
    };

}(jQuery));