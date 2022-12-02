import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { TaskParsedType } from 'store/boardSlice';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { thunkUpdateTaskInfo } from 'store/middleware/tasks';
import { thunkGetAllUsers } from 'store/middleware/users';
import {
  selectAssignedUsers,
  setModalClose,
  setTaskId,
  setTaskModalClose,
  setUsersAssigned,
  usersSelector,
} from 'store/modalSlice';
import { getMsgErrorBoard } from 'utils/func/getMsgErrorBoard';
import useDebounce from 'utils/hooks/useDebounce';
import MemberListItem, { UserAction } from './MemberListItem/MemberListItem';
import MembersAssigned from './MembersAssigned.tsx/MemberAssigned';
import styles from './taskMembers.module.scss';

type Props = {
  task: TaskParsedType | null;
  boardId: string;
  columnId: string;
};

const TaskMembers = ({ task, boardId, columnId }: Props) => {
  const allUsers = useAppSelector(usersSelector);
  const assignedMembers = useAppSelector(selectAssignedUsers);
  const assignedMembersRef = useRef(assignedMembers);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const menuOpen = useRef(false);

  const [membersArr, setMembersArr] = useState<string[]>([]);
  const debouncedValue = useDebounce<string[]>(membersArr);

  const taskRef = useRef(task);
  const listRef = useRef<HTMLUListElement | null>(null);
  const usersChecked = useRef<string[] | undefined>(task?.users ? task.users : []);

  useEffect(() => {
    const getUsers = async () => {
      await dispatch(thunkGetAllUsers())
        .unwrap()
        .then((allUsers) => {
          if (allUsers.length === 0) return;
          const getUserFullInfo = (id: string) => allUsers.find((user) => user._id === id);
          const assignedUsers = task?.users.map((user) => getUserFullInfo(user));
          dispatch(setUsersAssigned(assignedUsers ? assignedUsers : []));
          assignedMembersRef.current = assignedUsers ? assignedUsers : [];
        })
        .catch((err) => {
          const [code] = err.split('/');
          dispatch(setTaskModalClose());
          dispatch(setModalClose());
          toast.error(t(getMsgErrorBoard(code)));
        });
    };

    if (allUsers.length !== 0) {
      const getUserFullInfo = (id: string) => allUsers.find((user) => user._id === id);
      const assignedUsers = task?.users.map((user) => getUserFullInfo(user));
      dispatch(setUsersAssigned(assignedUsers ? assignedUsers : []));
      assignedMembersRef.current = assignedUsers ? assignedUsers : [];
    } else {
      getUsers();
    }

    return () => {
      dispatch(setUsersAssigned([]));
    };
  }, [allUsers, allUsers.length, dispatch, t, task?.users]);

  const fetchUsers = useRef(false);
  const fetchNewUsers = useCallback(
    async (debouncedValue: string[]) => {
      if (!taskRef.current || !menuOpen.current) return;
      const task = taskRef.current;

      dispatch(
        thunkUpdateTaskInfo({
          _id: task?._id,
          boardId: boardId,
          columnId: columnId,
          userId: task.userId,
          title: task.title,
          description: JSON.stringify({
            description: task.description.description,
            color: task.description.color,
          }),
          order: task.order,
          users: debouncedValue,
        })
      )
        .unwrap()
        .then(() => {
          dispatch(
            setTaskId({
              _id: task?._id,
              boardId: boardId,
              userId: task.userId,
              title: task.title,
              description: {
                description: task.description.description,
                color: task.description.color,
              },
              order: task.order,
              users: debouncedValue,
            })
          );
        })
        .catch((err) => {
          const [code] = err.split('/');
          if (code === '404') {
            dispatch(setTaskModalClose());
            dispatch(setModalClose());
          }
        })
        .finally(() => {
          fetchUsers.current = false;
        });
    },
    [boardId, columnId, dispatch]
  );

  useEffect(() => {
    const list = listRef.current;

    const clickHandler = ({ target }: MouseEvent) => {
      const listEl = !!(target as HTMLElement).getAttribute('data-member');
      if (!listEl) {
        setIsOpen(false);
        menuOpen.current = false;
        list?.scrollTo(0, 0);
      }
    };

    document.addEventListener('click', clickHandler);
    return () => {
      document.removeEventListener('click', clickHandler);

      if (fetchUsers) {
        fetchNewUsers(usersChecked.current ? usersChecked.current : []);
      }
    };
  }, [fetchNewUsers]);

  useEffect(() => {
    fetchNewUsers(debouncedValue);
  }, [debouncedValue, fetchNewUsers]);

  const addMembers = useCallback((id: string, userAction: string) => {
    if (!menuOpen.current) return;

    fetchUsers.current = true;
    let newUsersChecked;
    if (userAction === UserAction.REMOVE) {
      newUsersChecked = usersChecked.current?.filter((userId) => userId !== id);
    } else {
      newUsersChecked = usersChecked.current?.concat(id);
    }
    usersChecked.current = newUsersChecked;

    setMembersArr(usersChecked.current ? usersChecked.current : []);
  }, []);

  const openMenutOptions = () => {
    setIsOpen(true);
    menuOpen.current = true;
  };

  return (
    <div className={styles.taskInfo}>
      <h3 className={styles.members}>{t('MODAL.MEMBERS')}</h3>
      <div className={styles.membersWrapper}>
        {assignedMembers.length > 0 ? (
          <MembersAssigned members={assignedMembers} />
        ) : (
          <p className={styles.err}>{t('MODAL.MEMBERS_ERR')}</p>
        )}
      </div>
      <ul
        className={`${styles.list} ${isOpen ? styles.open : styles.close}`}
        onClick={openMenutOptions}
        ref={listRef}
        data-member="true"
      >
        {allUsers.length > 0 &&
          allUsers.map((user) => (
            <MemberListItem
              user={user}
              key={user._id}
              userHandler={addMembers}
              assignedMembers={assignedMembersRef.current}
              isOpen={isOpen}
            />
          ))}
      </ul>
    </div>
  );
};

export default TaskMembers;
