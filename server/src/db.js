var mysql = require('mysql');
var moment = require('moment');

var db = mysql.createConnection({
	host     : 'archive-db',
	user     : 'odaw',
	password : 'odaw',
	database : 'projeto_odaw'
});

const login =  function(email, senha, func) {
    db.query('SELECT * FROM usuario WHERE email = ? AND senha = ?', [email, senha], function (erro, results, fields) {
        if(erro) {
            func({
                erro: true,
                data: "Erro servidor"
            });
        } else {
            if (results.length > 0) {
                func({
                    erro: false,
                    data: results[0],
                });
            } else {
                func({
                    erro: true,
                    data: "Usuário ou senha incorreto"
                });
            }
        }
    });
}

const cadastrar = function(email, senha, func) {
    let sql = `INSERT INTO usuario (email, senha) VALUES ("${email}", "${senha}")`;
    var ret = {};
    db.query(sql, function (erro, result) {
      if (erro) {
        if(erro.code === "ER_DUP_ENTRY") {
            ret = {
                erro : true,
                index: 1,
                data : "Usuário já cadastrado"
            }
        } else {
            ret = {
                erro: true,
                index: 0,
                data: erro.message,
            }
        } 
      } else {
          ret = {
              erro: false,
              data: "Usuário cadastrado",
          };  
      }
      
      func(ret);
    });
}

const upload = function(id_usuario, nome, func) {
    id_usuario = parseInt(id_usuario);
    db.query('SELECT * FROM arquivo WHERE nome = ? AND id_usuario = ?', [nome, id_usuario], function (erro, results, fields) {
        if(erro) {
            func({
                erro: true,
                data: erro.message,
            });
        } else {
            var sql = '';
            //moment.locale('pt-br'); 
            var modificado = moment().locale('pt-br').format('YYYY-MM-DD HH:mm:ss');
            if (results.length > 0) {
                sql = `UPDATE arquivo SET modificado='${modificado}' WHERE id_usuario = ${id_usuario} and nome = "${nome}"`;
            } else {
                sql = `INSERT INTO arquivo (id_usuario, nome, modificado) VALUES (${id_usuario}, "${nome}", '${modificado}')`;
            }
            db.query(sql, function (erro, result) {
                if(erro) {
                    func({
                        erro: true,
                        data: erro.message,
                    });
                } else {
                    func({
                        erro: false,
                    });
                }
            });
        }
    });
};

const lista = function(id_usuario, func) {
    db.query('SELECT id, id_usuario, nome, modificado FROM arquivo WHERE id_usuario = ?', [id_usuario], function (erro, results, fields) {
        if(erro) {
            func({
                erro: true,
                data: erro.message,
            });
        } else {
            func({
                erro: false,
                data: results
            })
        }
    });
}

const deletar = function(id, id_usuario, func) {
    db.query('SELECT nome FROM arquivo WHERE id=? and id_usuario=?;', [id, id_usuario], function (erro, results, fields) {
        if(erro) {
            func({
                erro: true,
                data: erro.message,
            });
        } else {
            let nome = results[0].nome;
            db.query('DELETE FROM arquivo WHERE id=? and id_usuario=?;', [id, id_usuario], function (erro, results, fields) {
                if(erro) {
                    func({
                        erro: true,
                        data: erro.message,
                    })
                } else {
                    func({
                        erro: false,
                        data: nome
                    });
                }
            });
        }
    });
}

const download = function(id, id_usuario, func) {
    db.query('SELECT nome FROM arquivo WHERE id=? and id_usuario=?;', [id, id_usuario], function(erro, results, fields) {
        if(erro) {
            func({
                erro: true,
                data: erro.message,
            });
        } else {
            func({
                erro: false,
                data: {
                    nome: results[0].nome,
                }
            });
        }
    });
}

module.exports = {
    login: login,
    cadastrar: cadastrar,
    upload: upload,
    lista: lista,
    deletar: deletar,
    download: download,
};