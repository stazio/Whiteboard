var Messages = {
    APPEND_PATH : function(id, points) {
        return {
            action: "append_path_points",
            id: id,
            points: points
        };
    },

    NEW_PATH : function(path) {
        return {
            action: "new_path",
            path: path.to_dictionary()
        };
    },

    NEW_DIMENSIONS : function(width, height) {
        return {
            action: "new_dimensions",
            width: width,
            height: height
        };
    },

    CLEAR : function(){
        return {
            action: "clear"
        };
    }
};

function Room(width, height, broadcast) {
    this.width = width;
    this.height = height;
    this.broadcast = broadcast ;
    /**
     *
     * @type {Path}
     */
    this.paths = {};

    this.append_path_points = function(id, points) {
        if (this.paths.hasOwnProperty(id))
            this.paths[id].append(points);

        if (this.broadcast)
        this.broadcast(Messages.APPEND_PATH(id, points));
    };

    this.turn_to_messages = function() {
        var messages = [
            Messages.NEW_DIMENSIONS(this.width, this.height)
        ];
        for (var id in this.paths) {
            if (this.paths.hasOwnProperty(id))
                messages.push(Messages.NEW_PATH(this.paths[id]));
        }
        return messages;
    };

    this.add = function(path) {
        this.paths[path.id] = path;
        if (this.broadcast)
            this.broadcast(Messages.NEW_PATH(path));
    };

    this.clear = function() {
        this.paths = {};
        if (this.broadcast)
            this.broadcast(Messages.CLEAR());
    };

    this.new_dimensions = function(width, height) {
        this.width = width;
        this.height =height;
        if (this.broadcast)
            this.broadcast(Messages.NEW_DIMENSIONS(width, height));
    }
}

function Path(id, width, fill, points) {
    this.id = id;
    this.width = width;
    this.fill = fill;
    this.points = points;

    this.to_dictionary = function() {
        return {
            id: this.id,
            width: this.width,
            fill: this.fill,
            points: this.points
        };
    };

    this.append = function(point) {
        this.points.push(point);
    };
}

/**
 *
 * @param json object
 * @returns Path|boolean
 */
function parse_path(json) {

    // // Make sure everything is real!
    // if (!json.hasOwnProperty("id") || isNaN(json.width) || !json.hasOwnProperty("fill") || !Array.isArray(json.points)) {
    //     return false;
    // }
    //
    // // Make sure each point is real!
    // for (var i in json.points) {
    //     if (json.points.hasOwnProperty(i)) {
    //         if (!Array.isArray(json.points[i]) || isNaN(json.points[i][0]) || isNaN(json.points[i][1])) {
    //             return false;
    //         }
    //     }
    // }

    return new Path(json.id, json.width, json.fill, json.points);
}

function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}