const localStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcryptjs =  require('bcryptjs')

//Model de usuario
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')


module.exports = function(passport){

    passport.use(new localStrategy({usernameField: 'email', passwordField:'senha'}, (email, senha, done) => {
        Usuario.findOne({email: email}).then((usuario) => {
            if(!usuario){
                return done(null, false, {message: "Esta conta não existe"})
            }

            bcryptjs.compare(senha, usuario.senha, (error, senhasBatem) => {
                if(senhasBatem){
                    return done(null, usuario)
                }else{
                    return done(null, false, {message: "Senha incorreta"})
                }
            })

        })
    }))

    passport.serializeUser((usuario, done) => {
        done(null, usuario.id)
    })

    passport.deserializeUser((id, done) => {
        Usuario.findById( id, (error, usuario) => {
            done( error, usuario)
        })
    })

}