/*
	Light Object Engine Display (loEngineDisp)
	
	Written by robhshu, May 2012
	v0.0	Split rendering into seperate module
*/

/*
	loDraw
		Draw light object on rendering context
*/
loDraw = function( ctx, loObj, style )
{
	ctx.fillStyle = style;
	ctx.beginPath();
	
	if( !loObj.points )
	{
		ctx.arc(
			loObj.x,
			loObj.y,
			loObj.radius,
			0,
			2*Math.PI,
			false
		)
	}
	else
	{
		var p = loObj.at( 0 )
		ctx.moveTo( p.x, p.y );
		
		loEachVert(
			loObj,
			1,
			function( loP )
			{
				ctx.lineTo( loP.x, loP.y );
			}
		);
		
		ctx.lineTo( p.x, p.y );
		ctx.closePath();
	}
	
	ctx.fill();
}


loDrawDebug = function( ctx, loObj )
{
	if( !loObj.points )
	{
		// draw container circle
		ctx.strokeStyle = "rgb(200,200,200)";
		loDraw( ctx, loObj, "rgb(180,180,180)" )
		ctx.stroke()
		
		// draw midpoints
		ctx.strokeStyle = "rgb(100,100,100)";
		ctx.beginPath();
		ctx.arc(
			loObj.x,
			loObj.y,
			1,
			0,
			2*Math.PI,
			false
		)
		ctx.stroke()
	}
	else
	{
		// draw object
		loDraw( ctx, loObj, "rgb(180,180,180)" )
		
		// draw lines to midpoints
		var i = 0;
		while( i < loObj.sides )
		{
			// pass1
			ctx.strokeStyle = "rgb(200,200,200)";
			ctx.beginPath();
			var c = loAsPoint( loObj );
			ctx.moveTo( c.x, c.y )
			var a = loObj.midApprox( i )
			ctx.lineTo( a.x, a.y )
			ctx.stroke();
		
			// pass2
			ctx.strokeStyle = "rgb(100,100,100)";
			ctx.beginPath();
			var c = loAsPoint( loObj );
			ctx.moveTo( c.x, c.y )
			var a = loObj.midat( i )
			ctx.lineTo( a.x, a.y )
			ctx.stroke();
			
			++i
		}
		
		// draw container circle
		ctx.strokeStyle = "rgb(200,200,200)";
		ctx.beginPath();
		ctx.arc(
			loObj.x,
			loObj.y,
			loObj.length,
			0,
			2*Math.PI,
			false
		)
		ctx.stroke()
		
		
		ctx.fillStyle = "rgba(0,0,0,0.4)";
		loEachVert(
			loObj,
			0,
			function( loP )
			{
				ctx.beginPath()
				ctx.fillRect( loP.x-3, loP.y-3, 6, 6 );
				ctx.fill()
			}
		);
	}
}
