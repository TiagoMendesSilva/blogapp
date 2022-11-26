//Carregando módulos
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')

require('./models/Postagem')
const Postagem = mongoose.model("postagens")
require('./models/Categoria')
const Categoria = mongoose.model("categorias")

const admin = require('./routes/admin') 
const usuarios = require('./routes/usuarios')

const passport = require('passport')
require('./config/auth')(passport)

const db = require('./config/db')


//Solução 2 ao carregar dados na página de edição
// const Handlebars =  require('handlebars')
// const handlebars = require('express-handlebars')
// const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')



//Configurações
     //Template Engine
    //  const hbs = handlebars.create({defaultLayout:'main', handlebars:allowInsecurePrototypeAccess(Handlebars)})
     const hbs = handlebars.create({defaultLayout:'main'})
     app.engine('handlebars', hbs.engine);
     app.set('view engine','handlebars')

     //Sessão
     app.use(session({
         secret:"cursonode",
         resave:true,
         saveUninitialized:true
     }))

     //Passport
     app.use(passport.initialize())
     app.use(passport.session())

     app.use(flash())

     //Middleware
     app.use((req,res,next) => {
         //declarar variáveis locais
         res.locals.success_msg = req.flash('success_msg')
         res.locals.error_msg = req.flash('error_msg')
         res.locals.error = req.flash("error")
         res.locals.user = req.user || null
         next()
     })
     
     //Body Parser
     app.use(bodyParser.urlencoded({extended:true}))
     app.use(bodyParser.json())
    
     //Mongoose
     mongoose.Promise = global.Promise;
     mongoose.connect(db.mongoURI).then(() => {
         console.log("Conectado ao mongo")
     }).catch((error) => {
         console.log("Erro ao se conectar com o mongo: "+error)
     })



     //Public
        //Essa linha diz para o express que todos os arquivos estáticos estão na pasta public
        app.use(express.static(path.join(__dirname,"public")))

        //criando um middleware
        app.use((req,res,next) => {
            console.log("middleware")
            next()
        })

    


//Rotas
    //Rota principal
    app.get('/', (req, res) => {
        Postagem.find().populate("categoria").sort({date:"desc"}).lean().then((postagens) => {
            res.render("index", {postagens:postagens})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao exibir postagens recentes.")
            res.redirect('/404')
        }) 
        
    })
    
    app.get('/404', (req,res) => {
        res.send("Erro 404!")
    })

    app.get('/post/:slug', (req,res) => {
        Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
            if(postagem){
                res.render("postagem/index",{postagem:postagem})
            }else{
                req.flash("error_msg", "Esta postagem não existe")
                res.redirect('/')
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao redirecionar página da postagem")
            res.redirect('/')
        })
    })

    app.get('/categorias', (req,res) => {

        Categoria.find().lean().then((categorias) => {
            res.render('categorias/index',{categorias:categorias})
        

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao listar categorias")
            res.redirect("/")

        })

    })

    app.get('/categorias/:slug', (req,res) => {
        //Pesquisar pela categoria e verificar se existe, se existir listar as postagens pertencentes a categoria
        //No find -> Ache uma categoria que tenha o slug igual ao passado pelo parametro
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if(categoria){

                //Dentro do find -> Ache uma postagem que tenha a categoria igual ao id da categoria passada no slug 
                Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                    res.render('categorias/posts', {postagens: postagens, categoria: categoria})
                }).catch((err) => {
                    req.flash("error_msg", "Houve um erro ao listar postagens da categoria")
                    res.redirect('/categorias')
                })

            }else{
                req.flash("error_msg", "Essa categoria não existe")
                res.redirect('/categorias')

            }

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao redirecionar para a página de categoria")
            res.redirect('/categorias')
        })

    })






    //Grupo de rotas -> prefixo que fazem parte da rota admin
    app.use('/admin',admin)
    app.use('/usuarios',usuarios)



//Outros

const PORT = process.env.PORT || 8081
app.listen(PORT, function(req,res){
    console.log("Rodando na porta http://localhost:8081")
})