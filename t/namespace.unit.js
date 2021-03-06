/*global test:false, ok:false, stop:false, start:false, equal:false, Namespace:false, setTimeout:false */
if(!Date.now) Date.now = function(){ return (new Date()).getTime(); };
test('namespace',function(){
    ok(Namespace,'has Namespace');
    ok(Namespace('x'),'creation Namespace x');
    ok(Namespace('x.y'),'creation Namespace x.y');
    ok(Namespace('x.yy.zzz'),'creation Namespace x.yy.zzz');
});

test('namespace proc',function(){
    var count = 0;
    Namespace().apply(function(){
        var proc = Namespace.Proc(function($c){
            this["[1]"] = ++count;
            $c();
        }).next(function($c){
            this["[2]"] = ++count;
            $c();
        }).next(function($c){
            this["[3]"] = ++count;
            setTimeout(function(){
                $c();
            },100);
        }).next([
            function($c){
                ++count;
                $c();
            },
            function($c){
                ++count;
                $c();
            },
            Namespace.Proc(function($c){
                ++count;
                $c();
            }).next(function($c){
                ++count;
                $c();
            })
        ]).next(function($c){
            this["[8]"] = ++count;
            $c();
        });
        ok(proc);
        stop();
        proc.call({},function(state){
            start();
            ok(state);
            equal(state['[1]'],1);
            equal(state['[2]'],2);
            equal(state['[3]'],3);
            equal(state['[8]'],8);
            ok(true);
        });
    });
});


test('self define',function(){
    Namespace('x.y').define(function(ns){
        ok(ns.CURRENT_NAMESPACE,'x.y','creation Namespace x.y');
        ns.provide({
            exportOne : true,
            exportTwo : false,
            exportObject : function(){}
        });
    });
    Namespace('x.y').define(function(ns){
        ok(ns.CURRENT_NAMESPACE,'x.y','creation Namespace x.y');
        equal( ns.exportOne , true , 'export true');
        equal( ns.exportTwo , false, 'export false');
        ok( ns.exportObject ,'export Object');
        ns.provide({
            exportThree : function(){}
        });
    });
    Namespace.use('x.y *').apply(function(ns){
        equal( ns.exportOne , true , 'export true');
        equal( ns.exportTwo , false, 'export false');
        ok( ns.exportObject ,'export Object');
    });
    var count = 0;

    Namespace('something.utility')
    .define(function(ns){
        ok(true);
        equal(++count,1);
        ns.provide({
            tuneHtml : function(){}
        }); 
    });

    Namespace('application.model')
    .use('something.utility tuneHtml')
    .define(function(ns){
        ok(true);
        equal(++count,2);
        ns.provide({
           Test1 : function(){}
        });
    });
    Namespace('application.model')
    .use('something.utility tuneHtml')
    .define(function(ns){
        ok(true);
        equal(++count,3);
        ns.provide({
           Test2 : function(){}
        });
    });
    Namespace('application.model')
    .use('something.utility tuneHtml')
    .define(function(ns){
        ok(true);
        equal(++count,4);
        ns.provide({
            Test3 : function(){}
        });
    });

    Namespace.use('application.model').apply(function(ns){
        ok(true);
        ok(ns.application.model.Test1 );
        ok(ns.application.model.Test2 );
        ok(ns.application.model.Test3 );
    });

});

test('export',function(){
    Namespace('test').define(function(ns){
        equal(ns.CURRENT_NAMESPACE,'test','creation Namespace x.y');
        ns.provide({
            Item : function(){this.id = 1;},
            StringExtension : function(){ this.id = 1;}
        });
    });
    Namespace('apps')
    .use('test Item')
    .apply(function(ns){
        ok( ns.Item ,'test.Item export');
        ok(!ns.StringExtension,'test.Item not export');
    });
    Namespace('apps')
    .use('test Item,StringExtension')
    .apply(function(ns){
        ok( ns.Item ,'test.Item export');
        ok( ns.StringExtension,'test.StringExtension export');
    });
    Namespace('apps')
    .use('test Item, StringExtension')
    .apply(function(ns){
        ok( ns.Item ,'test.Item export');
        ok( ns.StringExtension,'test.StringExtension export');
    });
    Namespace('apps')
    .use('test Item=>MyItem')
    .apply(function(ns){
        ok( ns.MyItem ,'test.MyItem export');
        ok(!ns.Item ,'test.Item not export');
        ok(!ns.StringExtension,'test.Item not export');
    });
    Namespace('apps')
    .use('test Item => MyItem')
    .apply(function(ns){
        ok( ns.MyItem ,'test.MyItem export');
        ok(!ns.Item ,'test.Item not export');
        ok(!ns.StringExtension,'test.Item not export');
    });
});

test('use and define',function(){
    Namespace('test').define(function(ns){
        ok(ns.CURRENT_NAMESPACE,'test','creation Namespace x.y');
        ns.provide({
            Item : function(){this.id = 1;}
        });
    });
    Namespace('test2').define(function(ns){
        ns.provide({
            Item : function(){this.id = 2;}
        });
    });
    Namespace('x.y')
    .use('test')
    .use('test2')
    .apply(function(ns){
        var item1 = new ns.test.Item();
        var item2 = new ns.test2.Item();
        equal(item1.id,1,'item1 id');
        equal(item2.id,2,'item2 id');
    });

    Namespace('x.y')
    .use('test *')
    .use('test2')
    .apply(function(ns){
        var item1 = new ns.Item();
        var item2 = new ns.test2.Item();
        equal(item1.id,1,'item1 id');
        equal(item2.id,2,'item2 id');
    });

    Namespace('x.y')
    .use('test *')
    .use('test2 *')
    .apply(function(ns){
        var item1 = new ns.Item();
        var item2 = new ns.Item();
        equal(item1.id,2,'item1 id');
        equal(item2.id,2,'item2 id');
    });

    Namespace('x.y')
    .use('test')
    .use('test2')
    .define(function(ns){
        var item1 = new ns.test.Item();
        var item2 = new ns.test2.Item();
        equal(item1.id,1,'item1 id');
        equal(item2.id,2,'item2 id');
        ns.provide({
            itemList : [item1,item2]
        });
    });

    Namespace('x')
    .use('x.y')
    .apply(function(ns){
        ok(ns.x.y.itemList,'itemList ok');
    });

});


test('lazy export',function(){

    Namespace("org.example.net").define(function(ns){
        ok(true,'providing org.example.net');
        setTimeout(function(){
        ns.provide({
            HTTPRequest : function(){ },
            HTTPResponse : function(){ }
        });
        },10);
    });

    Namespace("org.example.system").define(function(ns){
        setTimeout(function(){
            ok(true,'providing org.example.system');
            start();
            ns.provide({
                Console : {
                    log : function(){return true; }
                }
            });
        },1000);
    });
    Namespace("org.example.application")
    .use('org.example.net *')
    .use('org.example.system Console')
    .define(function(ns){
        var req = new ns.HTTPRequest();
        var res = new ns.HTTPResponse();
        ok(req,'2nd HTTPResponse');
        ok(res,'2nd HTTPRequest');
        ok(ns.Console.log("ok"),'2nd Console.log');
    });
    Namespace("org.example.application")
    .use('org.example.net *')
    .use('org.example.system Console')
    .apply(function(ns){
        var req = new ns.HTTPRequest();
        var res = new ns.HTTPResponse();
        ok(req,'1st HTTPResponse');
        ok(res,'1st HTTPRequest');
        ok(ns.Console.log("ok"),'1st Console.log');
    });



    stop();
});



test('xhr get',function(){
    Namespace('org.yabooo.net').define(Namespace.GET('sample.js?' +Date.now()) );
    Namespace('org.yabooo.net').define(Namespace.GET('sample2.js?'+Date.now()) );
    Namespace('org.yabooo.net').define(function(ns){
        ns.provide({
            Item : function(){this.id = 2;}
        });
    });

    Namespace('sample')
    .use('org.yabooo.net')
    .apply(function(ns){
        start();
        ok( new ns.org.yabooo.net.TCPServer() );
        ok( new ns.org.yabooo.net.TCPClient() );
        ok( new ns.org.yabooo.net.SampleClass() );
    });

    stop();
});




test('xhr get use',function(){
    Namespace('org.yabooo.net').define( Namespace.GET('sample.js?' +Date.now() ));
    Namespace('org.yabooo.net2').define( Namespace.GET('sample2.js?'+Date.now()) );
    Namespace('org.yabooo.net').define(function(ns){
        ns.provide({
            Item : function(){this.id = 2;}
        });
    });

    Namespace('sample')
    .use('org.yabooo.net')
    .use('org.yabooo.net2')
    .apply(function(ns){
        start();
        ok( new ns.org.yabooo.net2.TCPServer() );
        ok( new ns.org.yabooo.net2.TCPClient() );
        ok( new ns.org.yabooo.net.SampleClass() );
    });

    stop();
});


test('script dom',function(){
    Namespace('org.yabooo.net').define( Namespace.fromExternal('sample3.js?'+Date.now()) );
    Namespace('org.yabooo.net2').define( Namespace.fromExternal('sample4.js?'+Date.now()) );
    Namespace('org.yabooo.net').define(function(ns){
        ns.provide({
            Item : function(){this.id = 2;}
        });
    });
    Namespace
    .use('org.yabooo.net')
    .use('org.yabooo.net2')
    .apply(function(ns){
        start();
        ok( new ns.org.yabooo.net.SomeClass() );
        ok( new ns.org.yabooo.net2.SomeClass2() );
    });

    stop();
});

test('script define',function(){
    Namespace('org.yabooo.net3').define( Namespace.fromExternal('sample5.js?'+Date.now()) );
    Namespace('org.yabooo.net3').define( Namespace.fromExternal('sample6.js?'+Date.now()) );
    Namespace('org.yabooo.net3').define(function(ns){
        ok( ns , 'third define');
        ns.provide({
            Item : function(){this.id = 2;}
        });
    });

    Namespace('sample')
    .use('org.yabooo.net3')
    .apply(function(ns){
        start();
        ok( new ns.org.yabooo.net3.TCPServer() );
        ok( new ns.org.yabooo.net3.TCPClient() );
        ok( new ns.org.yabooo.net3.Item() );
    });

    stop();
});
