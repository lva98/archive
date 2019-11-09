var fs = require('fs');
var dir = '~/';
var cmd = require('node-cmd');

const criar = function(email, func) {
    var local = '/home/node/arquivos/' + email;
    
    try {
        if (!fs.existsSync(local))
            fs.mkdirSync(local);

        func({
            erro: false,
            data: "Diretório criado com sucesso",
        })
    } catch (e) {
        func({
            erro: true,
            data: "Erro ao criar diretório",
        })
    }
}

const upload = function(email, oldpath, nome, data, func) {
    var newpath = '/home/node/arquivos/' + email + '/' + nome;
    fs.readFile(oldpath, function(erro, data) {
        if(erro) {
            func({
                erro: true,
                data: erro.message,
            })
        } else {
            fs.writeFile(newpath, data, function (erro) {
                if(erro) {
                    func({
                        erro: true,
                        data: erro.message,
                    });
                } else {
                    func({
                        erro: false,
                        data: "Arquivo salvo com sucesso",
                    });
                }

                fs.unlinkSync(oldpath);
            });
        }
    })
}

const salvar = function(email, nome, arquivo, func) {
    var path = '/home/node/arquivos/' + email + '/' + nome; 
    fs.writeFile(path, arquivo, (erro) => {
        if(erro) {
            func({
                erro: true,
                data: erro.message,
            });
        } else {
            func({
                erro: false,
                data: "Arquivo salvo com sucesso",
            })
        }
    });
}

const executar = function(email, arquivo, entrada, func) {
    var dir = '/home/node/arquivos/' + email + '/';
    var local_c = dir + 'user_temp.c';
    var local_entry = dir + 'entry_temp.txt'
    
    fs.writeFileSync(local_c, arquivo);
    fs.writeFileSync(local_entry, entrada);

    comando = 'gcc ' + local_c + ' -o ' + dir + 'user_temp';
    cmd.get(comando, (erro, data, sterr) => {
        if(erro) {
            let msg = ("Erro ao compilar\n"+sterr).split(local_c).join("file.c");
            func({
                erro: true,
                data: msg,
            })
        } else {
            comando = dir + 'user_temp < ' + local_entry;
            cmd.get(comando, (erro, data, sterr) => {
                if(erro) {
                    func({
                        erro: true,
                        data: "Erro ao executar\n"+sterr,
                    })
                } else {
                    console.log(local_c);
                    func({
                        erro: false,
                        data: data.replace(local_c, "file.c"),
                    })
                }
            });
        }
    });
}

const download = function(email, nome, func) {
    var dir = '/home/node/arquivos/' + email + '/' + nome;
    fs.exists(dir, (existe) => {
        if(!existe) {
            func({
                erro: true,
                data: "Erro ao baixar arquivo do diretório",
            });
        } else {
            func({
                erro: false,
                data: dir,
            });
        }
    });
}

const abrir = function(email, nome, func) {
    var dir = '/home/node/arquivos/' + email + '/' + nome;

    fs.readFile(dir, (erro, data) => {
        if(erro) {
            func({
                erro: true,
                data: erro.message
            });
        } else {
            func({
                erro: false,
                data: data
            });
        }
    })
}

const deletar = function(email, nome, func) {
    var dir_file = '/home/node/arquivos/' + email + '/' + nome;
    try {
        fs.unlinkSync(dir_file);

        func({
            erro: false,
            data: "Arquivo excluido com sucesso"
        });
    } catch(e) {
        func({
            erro: false,
            data: "Erro ao excluir arquivo"
        });
    }
}

module.exports = {
    criar: criar,
    upload: upload,
    download: download,
    deletar: deletar,
    abrir: abrir,
    salvar: salvar,
    executar: executar,
}