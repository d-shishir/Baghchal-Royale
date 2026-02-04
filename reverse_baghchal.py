

import pygame
import sys,time,random
INF = 1e6
from copy import deepcopy
pygame.init()
screen = pygame.display.set_mode((1300,900))
color = (255,204,153)
screen.fill(color)
pygame.display.set_caption('Bagh-Chal')

img_board = pygame.image.load('img/board.png')
img_tiger = pygame.image.load('img/tiger.png')
img_tiger = pygame.transform.scale(img_tiger, (60,60))
img_goat = pygame.image.load('img/goat.png')
img_goat = pygame.transform.scale(img_goat, (60,60))
myfont = pygame.font.SysFont("Comic Sans MS", 50)

def get_coord():
	global coord
	coord = [[(170,170),(295,170),(420,170),(545,170),(670,170)],[(170,295),(295,295),(420,295),(545,295),(670,295)],[(170,420),(295,420),(420,420),(545,420),(670,420)],[(170,545),(295,545),(420,545),(545,545),(670,545)],[(170,670),(295,670),(420,670),(545,670),(670,670)]] #2d array
	#left, right, top, down
	global occupied
	occupied = [['-' for col in range(5)] for row in range(5)]

	return coord,occupied

def get_moves(cur_pos,coord,kill):
	x = cur_pos[0];y = cur_pos[1]
	kill_coord = []
	#left, right, up, down
	global pos
	global co
	pos1 = [(-125,0),(125,0),(0,-125),(0,125),(-125,-125),(-125,125),(125,-125),(125,125)]
	pos2 = [(-125,0),(125,0),(0,-125),(0,125)]
	co1 = [(0,-1),(0,1),(-1,0),(1,0),(-1,-1),(1,-1),(-1,1),(1,1)]
	co2 = [(0,-1),(0,1),(-1,0),(1,0)]
	pos_n = []
	pos_t = []
	c = coord[x][y]
	d =(x,y)
	if((c[0]+c[1]) % 2 == 0):
		pos = pos1
		co = co1
		n = 8
	else:
		pos = pos2
		co = co2
		n = 4
	p = x
	q = y
	for i in range(n):
		p = x+co[i][0]
		q = y+co[i][1]
		#it checks if there is goat or not for possible moves
		if(p >= 0 and q >= 0 and p < 5 and q < 5 and occupied[p][q] == '-'):
			xn = c[0] + pos[i][0];yn = c[1] + pos[i][1]
			pos_n.append((xn,yn,i))
			pos_t.append((p,q))
		elif(p >= 0 and q >= 0 and p < 5 and q < 5 and occupied[p][q] == 'G'):
			p1 = p+co[i][0]
			q1 = q+co[i][1]
			if(p1 >= 0 and q1 >= 0 and p1 < 5 and q1 < 5 and occupied[p1][q1] == '-'):
				xn = c[0] + pos[i][0]*2;yn = c[1] + pos[i][1]*2
				pos_n.append((xn,yn,i))
				pos_t.append((p1,q1))
				kill = kill + 1
				kill_coord.append(((x,y),(p1,q1)))
	#print(pos_n)
	return pos_n,pos_t,kill,kill_coord
	

def get_mouse_click(coord, occupied):
	x,y=pygame.mouse.get_pos()
	#board starting at 200,200
	for i in range(5):
		for j in range(5):
			k = coord[i][j]
			if(k[0] <= x and k[1] <= y and k[0]+60 >= x and k[1]+60 >= y):
				coord_tiger = (i,j)
				return coord_tiger
	return (-1,-1)


def board(screen,occupied,coord,score,goat_killed,remaining):
	pygame.draw.rect(screen, (255,255,255), pygame.Rect(90, 90, 1120, 720))
	screen.blit(img_board,(200,200))#size 500X500
	label = myfont.render("Score:", 1, (0,0,0))
	screen.blit(label, (800, 350))
	sc = myfont.render(str(score), 1, (0,0,0))
	screen.blit(sc, (920, 350))
	label = myfont.render("Goats Killed:", 1, (0,0,0))
	screen.blit(label, (800, 400))
	sc = myfont.render(str(goat_killed), 1, (0,0,0))
	screen.blit(sc, (1030, 400))
	
	label = myfont.render("Goats Remaining:", 1, (0,0,0))
	screen.blit(label, (800, 450))
	sc = myfont.render(str(remaining), 1, (0,0,0))
	screen.blit(sc, (1110, 450))
	label = myfont.render("You", 1, (0,0,255))
	screen.blit(label, (800, 260))
	screen.blit(img_goat, (800, 200))
	label = myfont.render("Computer", 1, (0,0,255))
	screen.blit(label, (960, 260))
	screen.blit(img_tiger, (980, 195))
	for i in range(5):
		for j in range(5):
			if(occupied[i][j] == 'T'):
				screen.blit(img_tiger,coord[i][j])
			if(occupied[i][j] == 'G'):
				screen.blit(img_goat,coord[i][j])

#all possible moves of all tiger
def all_tiger_moves(arr):
	pos_tiger = []
	count = 0
	for i in range(5):
		for j in range(5):
			if(arr[i][j] == 'T'):
				m = get_moves((i,j),coord,0)
				for k in m[1]:
					pos_tiger.append(((i,j),k))
	return pos_tiger

#all possible moves of goat
def goat_moves(arr):
	pos_goat = []
	for i in range(5):
		for j in range(5):
			if(arr[i][j] == '-'):
				pos_goat.append((i,j))
	return pos_goat

def goal(kill):
	return kill == 5

def isMoveLeft(arr):
	for i in range(5):
		for j in range(5):
			if(arr[i][j] == '-'):
				return True
	return False

def evaluate_kill(arr):
	kill = 0
	for i in range(5):
		for j in range(5):
			if(arr[i][j] == 'T'):
				m = get_moves((i,j),coord,0)
				kill += m[2]
	return kill

#it will return all movable tigers
def movable_tiger(arr):
	Tiger = []
	m_T = 0
	for i in range(5):
		for j in range(5):
			if(arr[i][j] == 'T'):
				Tiger.append((i,j))
	for i in Tiger:
		move = get_moves(i,coord,0)
		if(len(move[0]) > 0):
			m_T = m_T + 1
	return m_T
	
		
#it will chooose bestMove and return
def findBestMove(arr) :
	cn = []
	for i in range(5):
		for j in range(5):
			if(arr[i][j] == 'T'):
				k = get_moves((i,j),coord,0)[2]
				k_l = get_moves((i,j),coord,0)[1]
				k_c = get_moves((i,j),coord,0)[3]
				if(k != 0):
					x = k_c[0]
					old = x[0]
					new = x[1]
					return old,new
				else:
					if(len(k_l) != 0):
						for l in k_l:	
							cn.append(((i,j),l))
	length = len(cn)
	i = random.randint(0,length-1)
	cn = cn[i]
	return cn[0],cn[1]

		  
def solve():
	coord,occupied = get_coord()
	occupied[0][4] = 'T';occupied[4][0] = 'T';
	occupied[0][0]  ='T';occupied[4][4] = 'T';
	done = False
	kill = 0
	flag = 1
	goat_remaining = 20
	done = False
	global score
	score = 0
	while not done:
		time.sleep(0.05)
		board(screen,occupied,coord,score,kill,goat_remaining)
		if(goal(kill)):
			myfont = pygame.font.SysFont("Comic Sans MS", 120)
			label = myfont.render("You Lost!!", 1, (255,0,0))
			screen.blit(label, (710, 600))
			done = True
			pygame.display.flip()
			time.sleep(5)
		elif(movable_tiger(occupied) == 0):
			myfont = pygame.font.SysFont("Comic Sans MS", 120)
			label = myfont.render("You Won!!", 1, (255,0,0))
			screen.blit(label, (710, 600))
			done = True
			pygame.display.flip()
			time.sleep(5)
		if(flag == 0):
			#print("Tiger")
			occupied1 = deepcopy(occupied)
			old_pos,new_pos = findBestMove(occupied)
			#print(bestMove)
			occupied[old_pos[0]][old_pos[1]] = '-'
			occupied[new_pos[0]][new_pos[1]] = 'T'
			if(abs(old_pos[0] - new_pos[0]) == 2  or abs(old_pos[1]-new_pos[1]) == 2):#kill goat
				if((old_pos[0] - new_pos[0] == 2) and (old_pos[1] - new_pos[1] == 2)):
					occupied[new_pos[0]+1][new_pos[1]+1] = '-'
				elif((old_pos[0] - new_pos[0] == 2) and (new_pos[1] - old_pos[1] == 2)):
					occupied[new_pos[0]+1][new_pos[1]-1] = '-'
				elif((new_pos[0] - old_pos[0] == 2) and (old_pos[1] - new_pos[1] == 2)):
					occupied[new_pos[0]-1][new_pos[1]+1] = '-'
				elif((new_pos[0] - old_pos[0] == 2) and (new_pos[1] - old_pos[1] == 2)):
					occupied[new_pos[0]-1][new_pos[1]-1] = '-'
				elif(old_pos[0] - new_pos[0] == 2):
					occupied[new_pos[0]+1][new_pos[1]] = '-'
				elif(new_pos[0] - old_pos[0] == 2):
					occupied[new_pos[0]-1][new_pos[1]] = '-'
				elif(old_pos[1] - new_pos[1] == 2):
					occupied[new_pos[1]][new_pos[1]+1] = '-'
				elif(new_pos[1] - old_pos[1] == 2):
					occupied[new_pos[0]][new_pos[1]-1] = '-'
				kill = kill + 1
				score = score + 3 * (4 - movable_tiger(occupied)) - 12 *1
			flag = 1
		for event in pygame.event.get():
			if event.type == pygame.QUIT:
				done = True
			elif event.type == pygame.MOUSEBUTTONDOWN and goat_remaining != 0:
				cd = get_mouse_click(coord, occupied)
				#if(occupied[cd[0]][cd[1]] == '-'):
				occupied[cd[0]][cd[1]] = 'G';
				goat_remaining = goat_remaining - 1
				flag = 0#next computer's move
				break
			elif event.type == pygame.MOUSEBUTTONDOWN and goat_remaining == 0:	
				cd = get_mouse_click(coord, occupied)
				dragging = True
			elif event.type == pygame.MOUSEBUTTONUP and goat_remaining == 0:
				dragging = False
				cu = get_mouse_click(coord, occupied)
				if ((cd[0]==-1 and cd[1] == -1) or (cu[0]==-1 and cu[1] == -1)):
					pass
				elif(occupied[cd[0]][cd[1]] == 'G' and occupied[cu[0]][cu[1]] == '-'):
					occupied[cd[0]][cd[1]] = '-'
					occupied[cu[0]][cu[1]] = 'G'
				flag = 0#next computer's move
				break

						
		pygame.display.flip()

def main():
	solve()
if __name__ == "__main__":
	main()

 
