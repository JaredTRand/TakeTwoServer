    /**
     * @name loadScene
     * @function
     * @description Loads a scene hierarchy and settings depending on the options.
     * @param {string} sceneName - Name of the scene to load.
     * @param {Object} [options] - Optional. Extra options to do extra processing on the GLB.
     * @param {boolean} [options.hierarchy] - Optional. Set to true if you want to load the scene hierarchy.
     * @param {boolean} [options.settings] - Optional. Set to true if you want to load the scene settings.
     * @param {pc.callbacks.LoadHierarchy} [callback] - Optional. This is called if there is an error or if the scene is loaded successfully.
     * @param {Object} [scope] - The object scope to call the callback with.
     */

function loadScene(sceneName, options, callback, scope) {
    var app = pc.Application.getApplication();
    var scene = app.scenes.find(sceneName);

    if (scene) {
        // Check if the scene data is already loaded, if it is we should assume
        // that it stay cached after we loaded the scene and added the 
        // entities to the scene graph
        var wasSceneLoaded = scene.loaded;

        app.scenes.loadSceneData(scene, function(err, scene) {
            if (err) {
                if (callback) {
                    callback.call(scope, err);
                }
            } else {
                var sceneParent = null;

                // Destroy all the entities on the app.root to completely remove 
                // the existing scenes
                var rootChildren = app.root.children;
                while(rootChildren.length > 0) {
                    rootChildren[0].destroy();
                }

                // As we've already loaded the scene data, the callbacks for these
                // functions will be called immediately
                if (options.settings) {
                    app.scenes.loadSceneSettings(scene, function (err) {
                        if (err && callback) {
                            callback.call(scope, err);
                        }
                    });
                }

                if (options.hierarchy) {
                    app.scenes.loadSceneHierarchy(scene, function (err, parent) {
                        if (err) {
                            if (callback) {
                                callback(err);
                            }
                        } else {
                            sceneParent = parent;
                        }
                    });
                }

                if (!wasSceneLoaded) {
                    app.scenes.unloadSceneData(scene);
                }

                if (callback) {
                    callback.call(scope, null, sceneParent);
                }
            }
        });
    } else {
        if (callback) {
            callback.call(scope, "Scene not found: " + sceneName);
        }
    }
}