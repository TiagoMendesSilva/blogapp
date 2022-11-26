const express = require('express')
const { append } = require('express/lib/response')
const router = express.Router()

const mongoose = require('mongoose')
require("../models/Usuario")
const Usuario = mongoose.model("usuarios") 

const bcryptjs = require('bcryptjs')

const passport =  require('passport')

router.get('/registro', (req,res) => {
    res.render('usuarios/registro')
})

router.post('/registro', (req,res) => {
    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome inválido"})
    }

    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null){
        erros.push({texto: "E-mail inválido"})
    }

    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
        erros.push({texto: "Senha inválido"})
    }

    if(req.body.senha.length < 4){
        erros.push({texto: "Senha muito curta"})
    }

    //Verificar se as senhas são iguais
    if(req.body.senha != req.body.senha2){
        erros.push({texto: "As senhas são diferentes, tente novamente!"})
    }

    //Verificar se existe erros, se existir lançar na página
    if(erros.length > 0){
        //Ir na página de registro.handlebars e fazer um for each
        res.render("usuarios/registro", {erros: erros}) 

    }else{
        //Verificar se o usuario que está tentando se cadastrar com o e-mail existe no banco de dados
        //Pesquisar usuario pelo e-mail
        Usuario.findOne({email: req.body.email}).then((usuario) => {
            if(usuario){
                req.flash("error_msg", "Já existe uma conta com esse e-mail.")
                res.redirect('/usuarios/registro')
            }else{

                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha
                })

                bcryptjs.genSalt(10, (erro, salt) => {
                    bcryptjs.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if(erro){
                            req.flash("error_msg", "Houve um erro ao salvar usuário")
                            res.redirect('/')
                        }
                        
                        novoUsuario.senha = hash

                        novoUsuario.save().then(() => {
                            req.flash("success_msg", "Usuário criado com sucesso!")
                            res.redirect('/')
                        }).catch((err) => {
                            req.flash("error_msg", "Houve um erro ao criar usuário, tente novamente!")
                            res.redirect('/usuarios/registro')
                        })
                    })
                })

                
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect('/')
        })
    }
})

router.get('/login', (req,res) => {
    res.render('usuarios/login')
})

//Rota para autenticação
router.post('/login', (req, res, next) => {

    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/usuarios/login',
        failureFlash: true
    })(req, res, next)
})

router.get("/logout", (req, res) => {
    req.logout(function(error){
        req.flash("success_msg", "Deslogado com sucesso!")
        res.redirect("/")
      
    })
    
})


module.exports = router