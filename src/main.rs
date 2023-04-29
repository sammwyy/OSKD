use axum::{body::Body, routing::get, Server};
use http::Response;
use rdev::{listen, Event};
use socketio_server::{
    config::SocketIoConfig, layer::SocketIoLayer, ns::Namespace, socket::Socket,
};
use std::{
    env, fs,
    sync::{Arc, Mutex},
    time::Duration,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting application...");

    // Create client list.
    let clients = Arc::new(Mutex::new(Vec::<Arc<Socket>>::new()));
    let clients_clone = clients.clone();

    // Create Socket.IO server.
    let config = SocketIoConfig::builder()
        .ping_interval(Duration::from_secs(5))
        .ping_timeout(Duration::from_secs(5))
        .max_payload(1e6 as u64)
        .build();

    let ns_handler = Namespace::builder()
        .add("/", move |socket| {
            let clients = clients_clone.clone();
            async move {
                clients.lock().unwrap().push(socket.clone());
            }
        })
        .build();

    // Listen keyboard.
    let callback = move |event: Event| {
        let json = serde_json::to_string(&event).unwrap();
        let clients_lock = clients.lock().unwrap();

        for socket in clients_lock.iter() {
            socket.emit("input", json.clone()).unwrap();
        }
    };

    // Create HTTP service.
    let app = axum::Router::new()
        .route(
            "/",
            get(move || async {
                let html = include_str!("../public/index.html");
                Response::new(Body::from(html))
            }),
        )
        .route(
            "/app.js",
            get(move || async {
                let js = include_str!("../public/app.js");
                js
            }),
        )
        .route(
            "/socket-io.js",
            get(move || async {
                let js = include_str!("../public/socket-io.js");
                js
            }),
        )
        .route(
            "/config.json",
            get(move || async {
                // Load configuration.
                let config_file = env::current_dir().unwrap().join("config.json");

                if config_file.exists() {
                    return fs::read_to_string(config_file).unwrap();
                } else {
                    let config = include_str!("../public/default_config.json").to_string();
                    fs::write(config_file, config.clone()).unwrap();
                    return config;
                }
            }),
        )
        .layer(SocketIoLayer::from_config(config, ns_handler));

    tokio::task::spawn(async move {
        let addr = "127.0.0.1:41770";
        println!("Listening widget on http://{}/", addr);

        Server::bind(&addr.parse().unwrap())
            .serve(app.into_make_service())
            .await
            .unwrap();
    });

    println!("Listening for keyboard input");
    if let Err(error) = listen(callback) {
        println!("Error listening for Keyboard input: {:?}", error)
    };

    Ok(())
}
