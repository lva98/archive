// https://www.luiztools.com.br/post/http-para-programadores-node-js/
var banco = require(__dirname + '/db.js');
var diretorio = require(__dirname + '/diretorio.js');
var express = require("express");
var session = require('express-session');
var bodyParser = require('body-parser');
var formidable = require('formidable');
const formidableMiddleware = require('express-formidable');
var fs = require('fs');

var app = express();
var path = __dirname + '/views/';

app.set('views', path);
app.set('view engine', 'ejs');  

app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

app.use('/', function(request, response, next) {
  if(request.originalUrl != '/favicon.ico') {
    console.log(request.headers['x-forwarded-for'] || request.connection.remoteAddress, '-',request.method, request.originalUrl);
  }
  next();
});

app.use('/home/', function (request, response, next) {
  if(request.session.data === undefined || !request.session.data.autenticado) {
    response.redirect("/login");
  } else 
    next();
});

app.get("/", function(request, response) {
  if(request.session.data === undefined || !request.session.data.autenticado) { 
    response.redirect("login");
  } else {
    response.redirect("home");
  }
});

app.get('/home', async function(request, response) {
  let id_usuario = request.session.data.usuario.id;
  banco.lista(id_usuario, function(ret) {
    if(ret.erro == true) {
      response.render("mensagem", {
        titulo: "Erro",
        info: ret.data,
        back: "home"
      });
    } else {
      response.render('home', {
        usuario: request.session.data.usuario,
        data: ret.data
      });
    }
  });
});

app.get("/login", function(request, response) {
  if(request.session.loggedin) 
    response.redirect("/home");
  else 
    response.sendFile(path + "login.html");
});

app.get("/cadastro", function(request, response) {
  response.sendFile(path + "cadastro.html");
});

app.post("/home/upload", function(request, response) {
  var form = new formidable.IncomingForm();
  form.parse(request, function (erro, fields, files) {
    var ext;
    if(typeof files.arquivo.name == 'undefined') 
      ext = '-1';
    else 
      ext = files.arquivo.name.split('.')[1];
    
    if(ext === '-1' || ext !== 'c' || erro) {
      response.render("mensagem", {
        titulo: "Erro",
        info: "Só é permitido upload de arquivo C",
        back: "/"
      });
    } else {
      fs.readFile(files.arquivo.path, (err, data) => {
        if (err) {
          response.render("mensagem", {
            titulo: "Erro",
            info: "Erro ao salvar arquivo",
            back: "/"
          });
        } else {
          let id_usuario = request.session.data.usuario.id;
          let email = request.session.data.usuario.email;
          let nome = files.arquivo.name;
          let oldpath = files.arquivo.path;
          
          banco.upload(id_usuario, nome, function(ret) {
            if(ret.erro) {
              response.render("mensagem", {
                titulo: "Erro",
                info: ret.data,
                back: "/"
              });
            } else {
              diretorio.upload(email, oldpath, nome, data, function (ret) {
                if(ret.erro) {
                  response.render("mensagem", {
                    titulo: "Erro",
                    info: ret.data,
                    back: "/"
                  });
                } else {
                  response.redirect("/");
                }
              });
            }
          });
        }
      });
    }
  });
});

app.get("/sair", function(request, response) {
  request.session.destroy(function(err) {
    if(err) {
      return next(err);
    } else {
      return response.redirect('/');
    }
  });
});

app.get("/home/deletar/:id", function(request, response) {
  let id_usuario = request.session.data.usuario.id;
  let email = request.session.data.usuario.email;
  let id = request.params.id;
  banco.deletar(id, id_usuario, function(ret) {
    if(ret.erro == true) {
      response.render("mensagem", {
        titulo: "Erro",
        info: ret.data,
        back: "home"
      });
    } else {
      nome = ret.data;
      diretorio.deletar(email, nome, function(ret) {
        if(ret.erro) {
          response.render("mensagem", {
            titulo: "Erro",
            info: ret.data,
            back: "home"
          });
        } else {
          response.redirect("/");
        }
      });
    }
  });
});

app.get("/home/download/:id", function(request, response) {
  var id_usuario = request.session.data.usuario.id;
  var email = request.session.data.usuario.email;
  var id = request.params.id;

  banco.download(id, id_usuario, function(ret) {
    if(ret.erro) {
      response.render("mensagem", {
        titulo: "Erro",
        info: ret.data,
        back: "home"
      });
    } else {
      let nome = ret.data.nome;
      diretorio.download(email, nome, function(ret) {
        if(ret.erro) {
          response.render("mensagem", {
            titulo: "Erro",
            info: ret.data,
            back: "/"
          });
        } else {
          response.download(ret.data);
        }
      });
    }
  });
}); 

app.get("/home/arquivo/:id", function(request, response) {
  var id_usuario = request.session.data.usuario.id;
  var email = request.session.data.usuario.email;
  var id = request.params.id;
  banco.download(id, id_usuario, (ret) => {
    if(ret.erro) {
      response.render('mensagem', {
        titulo: 'Erro',
        info: ret.data,
        back: "/",
      })
    } else {
      let nome = ret.data.nome;

      diretorio.abrir(email, nome, (ret) => {
        if(ret.erro) {
          response.render('mensagem', {
            titulo: 'Erro',
            info: ret.data,
            back: "/",
          });
        } else {
          let arquivo = ret.data;
          response.render("arquivo", {
            usuario: request.session.data.usuario,
            arquivo: arquivo,
            nome: nome
          });
        }
      })
    }
  });
});

app.all("/salvar", express.json(), function(request, response) {
  let email = request.body.email;
  let id_usuario = request.body.id_usuario;
  let nome = request.body.nome;
  let arquivo = request.body.arquivo;

  banco.upload(id_usuario, nome, (ret) => {
    if(ret.erro) {
      response.status(500).json({
        info: ret.data,
      });
    } else {
      diretorio.salvar(email, nome, arquivo, (ret) => {
        if(ret.erro) {
          console.log(ret.data);
          response.status(500).json({
            info: ret.data,
          });
        } else {
          response.status(200).json({
            info: "Tudo certo meu irmão!",
          });
        }
      });
    }
  });
});



app.all("/executar", express.json(), (request, response) => {
  let email = request.body.email;
  let id_usuario = request.body.id_usuario;
  let nome = request.body.nome;
  let arquivo = request.body.arquivo;
  let entrada = request.body.entrada

  diretorio.executar(email, arquivo, entrada, (ret) => {
    if(ret.erro) {
      response.status(500).json({
        info: ret.data,
      })
    } else {
      response.status(200).json({
        info: ret.data,
      });
    }
  });
});

app.post('/autenticar', bodyParser.json(), bodyParser.urlencoded({ extended: true }), function(request, response) {
  var email = request.body.email;
	var senha = request.body.senha;
	if (email && senha) {
    banco.login(email, senha, function(ret) {
      if(ret.erro) {
        response.render("mensagem", {
          titulo: "Erro",
          info: ret.data,
          back: "login"
        });
      } else {
        request.session.data = {
          autenticado: true,
          usuario: ret.data,
        }
        response.redirect('/home');
      }
    });
	} else {
    response.render("mensagem", {
      titulo: "Erro",
      info: "Campo vazio",
      back: "login"
    });
		//response.send('Campo vazio');
	}
});

app.post("/cadastrar", bodyParser.json(), bodyParser.urlencoded({ extended: true }), function(request, response) {
  if(request.body.senha1 !== request.body.senha2) {
    response.render("mensagem", {
      titulo: "Erro",
      info: "As senhas não conferem",
      back: "cadastro"
    });
  } else {
    let email = request.body.email;
    let senha = request.body.senha1;

    banco.cadastrar(email, senha, function (ret) {
      if(!ret.erro) {
        diretorio.criar(email, function(ret) {
          if(!ret.erro) {
            response.render("mensagem", {
              titulo: "Info",
              info: "Usuário cadastrado com sucesso!",
              back: "login"
            });
          } else {
            response.render("mensagem", {
              titulo: "Erro",
              info: ret.data,
              back: "login"
            });
          }
        });
      } else {
        response.render("mensagem", {
          titulo: "Erro",
          info: ret.data,
          back: "cadastro"
        });
      }
    });
  }
});

app.post("/home/novo", bodyParser.json(), bodyParser.urlencoded({ extended: true }), function(request, response) {
  let id_usuario = request.session.data.usuario.id;
  let email = request.session.data.usuario.email;
  let nome = request.body.arquivo;

  console.log(nome);
  
  banco.upload(id_usuario, nome, function(ret) {
    if(ret.erro) {
      response.render("mensagem", {
        titulo: "Erro",
        info: ret.data,
        back: "/"
      });
    } else {
      diretorio.upload(email, '', nome, '', function (ret) {
        if(ret.erro) {
          response.render("mensagem", {
            titulo: "Erro",
            info: ret.data,
            back: "/"
          });
        } else {
          response.redirect("/");
        }
      });
    }
  });
});

app.use(function(request, response, next) {
  response.status(404).render('mensagem', {
    titulo: 'Erro',
    info: "Página não encontrada",
    back: "/",
  })
});

app.listen(8080, function () {
  console.log('Projeto redes rodando na PORTA 8080')
});