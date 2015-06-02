/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



var controller = {
    wayPoints: true,
    boundingBoxes: false,
    ballisticTrajectory: false,
    healthBar: true,
    pause : false,
    

    init: function (gui) {
        var v1 = gui.addFolder('Visualization');
        var v2 = gui.addFolder('Game Control');
        
        v1.add(controller, "wayPoints");
        v1.add(controller, "boundingBoxes");
        v1.add(controller, "ballisticTrajectory");
        v1.add(controller, "healthBar");
        
        v2.add(controller, "pause");

        gui.close();
    }
};
